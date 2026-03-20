import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpTrayIcon, PhotoIcon } from '@heroicons/react/24/outline';
import fieldService from '../services/fieldService';
import teamService from '../services/teamService';
import { DEFAULT_JERSEY_COLOR, normalizeHexColor, normalizeJerseyColors } from '../utils/teamColors';
import { compressImageForUpload } from '../utils/imageCompression';

const MAX_TEAM_LOGO_SIZE_MB = 5;
const MAX_TEAM_LOGO_SIZE_BYTES = MAX_TEAM_LOGO_SIZE_MB * 1024 * 1024;

const TeamCreatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/owner') ? '/owner' : '/app';

  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    skillLevel: 'intermediate',
    maxPlayers: 11,
    homeFieldId: '',
    jerseyColors: [DEFAULT_JERSEY_COLOR]
  });

  useEffect(() => {
    const fetchFields = async () => {
      try {
        setLoading(true);
        const response = await fieldService.getAllFields({ status: 'available' });
        const fieldsData = Array.isArray(response.data) ? response.data : [];
        setFields(fieldsData);
      } catch (err) {
        console.error('Failed to load fields:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'maxPlayers' ? Number(value) : value
    }));
  };

  const setJerseyColorAt = (index, value) => {
    const normalized = normalizeHexColor(value) || DEFAULT_JERSEY_COLOR;
    setFormData((prev) => {
      const next = Array.isArray(prev.jerseyColors) ? [...prev.jerseyColors] : [DEFAULT_JERSEY_COLOR];
      next[index] = normalized;
      return { ...prev, jerseyColors: next };
    });
  };

  const handleAddJerseyColor = () => {
    setFormData((prev) => {
      const current = Array.isArray(prev.jerseyColors) ? [...prev.jerseyColors] : [DEFAULT_JERSEY_COLOR];
      if (current.length >= 5) return prev;
      return { ...prev, jerseyColors: [...current, DEFAULT_JERSEY_COLOR] };
    });
  };

  const handleRemoveJerseyColor = (index) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.jerseyColors) ? [...prev.jerseyColors] : [DEFAULT_JERSEY_COLOR];
      if (current.length <= 1) return prev;
      current.splice(index, 1);
      return { ...prev, jerseyColors: current };
    });
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file for the team picture.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_TEAM_LOGO_SIZE_BYTES) {
      setError(`Team picture must be smaller than ${MAX_TEAM_LOGO_SIZE_MB}MB.`);
      e.target.value = '';
      return;
    }

    const compressedFile = await compressImageForUpload(file, {
      maxWidth: 900,
      maxHeight: 900,
      targetMaxBytes: 450 * 1024,
      minCompressBytes: 150 * 1024
    });

    setError(null);
    setSelectedLogoFile(compressedFile);
    setLogoPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(compressedFile);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const normalizedColors = normalizeJerseyColors(formData.jerseyColors);
      if (normalizedColors.length < 1) {
        setError('Please choose at least 1 jersey color.');
        return;
      }

      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        skillLevel: formData.skillLevel,
        maxPlayers: Number(formData.maxPlayers) || 11,
        homeFieldId: formData.homeFieldId ? Number(formData.homeFieldId) : undefined,
        jerseyColors: normalizedColors
      };

      const response = await teamService.createTeam(payload);
      if (response.success) {
        let createdTeamId = response.data?.id || response.data?.team?.id || response.data?.data?.id || null;

        if (!createdTeamId) {
          try {
            const captainedTeamsResponse = await teamService.getCaptainedTeams();
            const captainedTeams = Array.isArray(captainedTeamsResponse.data) ? captainedTeamsResponse.data : [];
            const matchingTeam = captainedTeams.find((team) => team?.name === payload.name);
            createdTeamId = matchingTeam?.id || captainedTeams[0]?.id || null;
          } catch {
            createdTeamId = null;
          }
        }

        let navigationState = { successMessage: 'Team created successfully!' };

        if (createdTeamId && selectedLogoFile) {
          try {
            const uploadFormData = new FormData();
            uploadFormData.append('logo', selectedLogoFile);
            await teamService.uploadTeamLogo(createdTeamId, uploadFormData);
            navigationState = { successMessage: 'Team created successfully with team picture!' };
          } catch (uploadErr) {
            navigationState = {
              errorMessage: uploadErr?.error || 'Team created, but the team picture upload failed.'
            };
          }
        }

        navigate(createdTeamId ? `${basePath}/teams/${createdTeamId}` : `${basePath}/teams`, {
          replace: true,
          state: navigationState
        });
      }
    } catch (err) {
      setError(err?.error || 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Team</h1>
        <p className="mt-1 text-sm text-gray-600">Create a new team and start managing players.</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Team Name</label>
          <input
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Downtown FC"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Team Picture</label>
            <span className="text-xs text-gray-500">Optional, up to {MAX_TEAM_LOGO_SIZE_MB}MB</span>
          </div>
          <div className="mt-2 flex items-center gap-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
            <div className="h-24 w-24 overflow-hidden rounded-xl border border-gray-200 bg-white flex items-center justify-center shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Team logo preview" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center">
                  <PhotoIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-1 text-[11px] text-gray-500">No picture</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                <ArrowUpTrayIcon className="h-4 w-4" />
                Upload Picture
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </label>
              <p className="text-xs text-gray-500">PNG, JPG, GIF, or WEBP. Best result: square image.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Skill Level</label>
            <select
              name="skillLevel"
              value={formData.skillLevel}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="professional">Professional</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Max Players</label>
            <input
              type="number"
              name="maxPlayers"
              min={1}
              max={50}
              value={formData.maxPlayers}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-gray-700">Team Jersey Colors</label>
            <button
              type="button"
              onClick={handleAddJerseyColor}
              disabled={(formData.jerseyColors || []).length >= 5}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Add Color
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {(formData.jerseyColors || []).map((color, index) => (
              <div key={`${color}-${index}`} className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(event) => setJerseyColorAt(index, event.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white p-1"
                  aria-label={`Select jersey color ${index + 1}`}
                />
                <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold uppercase text-gray-700">
                  {color}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveJerseyColor(index)}
                  disabled={(formData.jerseyColors || []).length <= 1}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">Choose one or more colors (up to 5) to avoid match-day color clashes.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Home Field (Optional)</label>
          <select
            name="homeFieldId"
            value={formData.homeFieldId}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          >
            <option value="">No home field</option>
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name} ({field.city})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="About your team..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            to={`${basePath}/teams`}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Team'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeamCreatePage;

