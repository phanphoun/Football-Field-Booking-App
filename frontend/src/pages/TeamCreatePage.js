import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import fieldService from '../services/fieldService';
import teamService from '../services/teamService';

const TeamCreatePage = () => {
  const navigate = useNavigate();

  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    skillLevel: 'intermediate',
    maxPlayers: 11,
    homeFieldId: ''
  });

  useEffect(() => {
    const fetchFields = async () => {
      try {
        setLoading(true);
        const response = await fieldService.getAllFields();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'maxPlayers' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        skillLevel: formData.skillLevel,
        maxPlayers: Number(formData.maxPlayers) || 11,
        homeFieldId: formData.homeFieldId ? Number(formData.homeFieldId) : undefined
      };

      const response = await teamService.createTeam(payload);
      if (response.success) {
        const createdTeamId = response.data?.id;
        navigate(createdTeamId ? `/app/teams/${createdTeamId}` : '/app/teams');
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

        <div className="flex justify-end gap-3 pt-2">
          <Link
            to="/app/teams"
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

