import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline';
import bookingService from '../services/bookingService';
import teamService from '../services/teamService';
import { useLanguage } from '../context/LanguageContext';
import { Badge, Button, Card, CardBody, EmptyState, Spinner, useToast } from '../components/ui';
import { getTeamJerseyColors } from '../utils/teamColors';
import { useAuth } from '../context/AuthContext';

const OpenMatchesPage = () => {
<<<<<<< HEAD
  const { user } = useAuth();
  const canUseOpenMatches = ['captain', 'field_owner'].includes(user?.role || '');
=======
  const { language } = useLanguage();
  const text = (en, km) => (language === 'km' ? km : en);
  const { showToast } = useToast();
>>>>>>> 295927653451b883e4b5e944422c9129dd512ccc
  const [openMatches, setOpenMatches] = useState([]);
  const [captainedTeams, setCaptainedTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState({});
  const [messages, setMessages] = useState({});
  const [submittingMap, setSubmittingMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!successMessage) return;
    showToast(successMessage, { type: 'success', duration: 3200 });
    setSuccessMessage('');
  }, [showToast, successMessage]);

  useEffect(() => {
    if (!error) return;
    showToast(error, { type: 'error', duration: 3600 });
    setError(null);
  }, [error, showToast]);

  const defaultTeamId = useMemo(() => {
    if (captainedTeams.length === 0) return '';
    return String(captainedTeams[0].id);
  }, [captainedTeams]);

  const loadData = useCallback(async () => {
    if (!canUseOpenMatches) {
      setOpenMatches([]);
      setCaptainedTeams([]);
      setError('This feature is available for team captains and field owners only.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [matchesResponse, teamsResponse] = await Promise.all([
        bookingService.getOpenMatches(),
        teamService.getCaptainedTeams()
      ]);

      const matches = Array.isArray(matchesResponse.data) ? matchesResponse.data : [];
      const teams = Array.isArray(teamsResponse.data) ? teamsResponse.data : [];
      setOpenMatches(matches);
      setCaptainedTeams(teams);
    } catch (err) {
      console.error('Failed to load open matches:', err);
      setError(err.error || text('Failed to load open matches', 'មិនអាចផ្ទុកការប្រកួតបើកចំហបានទេ'));
    } finally {
      setLoading(false);
    }
  }, [canUseOpenMatches]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!defaultTeamId) return;
    setSelectedTeams((prev) => {
      const next = { ...prev };
      for (const match of openMatches) {
        if (!next[match.id]) next[match.id] = defaultTeamId;
      }
      return next;
    });
  }, [openMatches, defaultTeamId]);

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const hasPendingRequest = (match) =>
    Array.isArray(match.myRequests) && match.myRequests.some((request) => request.status === 'pending');

  const handleSubmitRequest = async (bookingId) => {
    try {
      const selectedTeamId = Number(selectedTeams[bookingId]);
      if (!selectedTeamId) {
          setError(text('Please choose a team before sending the request.', 'សូមជ្រើសក្រុមមួយមុននឹងផ្ញើសំណើ។'));
        return;
      }

      setSubmittingMap((prev) => ({ ...prev, [bookingId]: true }));
      setSuccessMessage('');
      await bookingService.requestJoinMatch(bookingId, selectedTeamId, messages[bookingId] || '');
      setSuccessMessage(text('Join request submitted successfully.', 'បានផ្ញើសំណើចូលរួមដោយជោគជ័យ។'));
      await loadData();
    } catch (err) {
      console.error('Failed to submit join request:', err);
      setError(err.error || text('Failed to submit join request', 'មិនអាចផ្ញើសំណើចូលរួមបានទេ'));
    } finally {
      setSubmittingMap((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text('Open Matches', 'ការប្រកួតបើកចំហ')}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {text('Find bookings that are open for opponents and send join requests.', 'ស្វែងរកការកក់ដែលបើកសម្រាប់គូប្រកួត ហើយផ្ញើសំណើចូលរួម។')}
          </p>
        </div>
        <Badge tone="gray">{text(`${openMatches.length} available`, `${openMatches.length} អាចចូលរួមបាន`)}</Badge>
      </div>

      {captainedTeams.length === 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-3 rounded-md text-sm">
          {text('You need at least one team where you are captain to request an open match.', 'អ្នកត្រូវការយ៉ាងហោចណាស់មួយក្រុមដែលអ្នកជាកាពីតែន ដើម្បីស្នើចូលរួមការប្រកួតបើកចំហ។')}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="divide-y divide-gray-200">
          {openMatches.length > 0 ? (
            openMatches.map((match) => {
              const ownerColors = getTeamJerseyColors(match.team);
              const selectedTeam = captainedTeams.find((team) => String(team.id) === String(selectedTeams[match.id] || ''));
              const selectedColors = selectedTeam ? getTeamJerseyColors(selectedTeam) : [];

              return (
              <CardBody key={match.id} className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-gray-900">{match.field?.name || text('Unknown Field', 'មិនស្គាល់ទីលាន')}</h3>
                        <Badge tone="blue">{text('Open for Opponents', 'បើកសម្រាប់គូប្រកួត')}</Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {formatDate(match.startTime)}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatTime(match.startTime)} - {formatTime(match.endTime)}
                      </div>
                      <div className="flex items-center">
                        <UsersIcon className="h-4 w-4 mr-1" />
                        {text('Owner Team:', 'ក្រុមម្ចាស់:')} {match.team?.name || text('Unknown Team', 'មិនស្គាល់ក្រុម')}
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1">
                          {ownerColors.map((color, index) => (
                            <span key={`owner-${match.id}-${color}-${index}`} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                          ))}
                        </span>
                      </div>
                    </div>

                    {hasPendingRequest(match) && (
                       <p className="mt-2 text-sm text-yellow-700">{text('You already have a pending request for this match.', 'អ្នកមានសំណើកំពុងរង់ចាំសម្រាប់ការប្រកួតនេះរួចហើយ។')}</p>
                    )}
                  </div>

                  <div className="w-full max-w-sm space-y-2">
                    <select
                      value={selectedTeams[match.id] || ''}
                      onChange={(e) => setSelectedTeams((prev) => ({ ...prev, [match.id]: e.target.value }))}
                      disabled={captainedTeams.length === 0 || hasPendingRequest(match)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                    >
                        <option value="">{text('Select your team', 'ជ្រើសក្រុមរបស់អ្នក')}</option>
                      {captainedTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                    <textarea
                      rows={2}
                       placeholder={text('Optional message', 'សារបន្ថែម')}
                      value={messages[match.id] || ''}
                      onChange={(e) => setMessages((prev) => ({ ...prev, [match.id]: e.target.value }))}
                      disabled={captainedTeams.length === 0 || hasPendingRequest(match)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                    />
                    <Button
                      className="w-full"
                      onClick={() => handleSubmitRequest(match.id)}
                      disabled={captainedTeams.length === 0 || hasPendingRequest(match) || submittingMap[match.id]}
                    >
                      {submittingMap[match.id] ? text('Sending...', 'កំពុងផ្ញើ...') : text('Request to Join', 'ស្នើចូលរួម')}
                    </Button>
                    {selectedTeam && (
                      <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1">
                        {selectedColors.map((color, index) => (
                          <span key={`selected-${match.id}-${color}-${index}`} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            )})
          ) : (
            <div className="p-6">
              <EmptyState
                icon={CalendarIcon}
                title={text('No open matches right now', 'ពេលនេះមិនមានការប្រកួតបើកចំហទេ')}
                description={text('Check again later for new matches opened by other captains.', 'សូមពិនិត្យម្តងទៀតពេលក្រោយ សម្រាប់ការប្រកួតថ្មីៗដែលបើកដោយកាពីតែនផ្សេងទៀត។')}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default OpenMatchesPage;
