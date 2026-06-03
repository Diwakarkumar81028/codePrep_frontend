import { useState, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';

const SubmissionHistory = ({ problemId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!problemId) {
        setError('Problem ID missing in frontend client routing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axiosClient.get(`/problem/submissions/${problemId}`);
        
        // FIX: Handle object wrappers like response.data.submissions or response.data.data safely
        const rawData = response.data;
        if (Array.isArray(rawData)) {
          setSubmissions(rawData);
        } else if (rawData && Array.isArray(rawData.submissions)) {
          setSubmissions(rawData.submissions);
        } else if (rawData && Array.isArray(rawData.data)) {
          setSubmissions(rawData.data);
        } else {
          setSubmissions([]); // Fallback array to prevent crashing
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch submission history');
        console.error('API Error details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [problemId]);

  const getStatusColor = (status) => {
    if (!status) return 'badge-neutral';
    switch (status.toLowerCase()) {
      case 'accepted': return 'badge-success';
      case 'wrong':
      case 'wrong_answer': return 'badge-error';
      case 'error': return 'badge-warning';
      case 'pending': return 'badge-info';
      default: return 'badge-neutral';
    }
  };

  const formatMemory = (memory) => {
    if (!memory) return '0 kB';
    if (memory < 1024) return `${memory} kB`;
    return `${(memory / 1024).toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error shadow-lg my-4 w-full">
        <div className="flex gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-2">
      {/* Safe check for array structures */}
      {!Array.isArray(submissions) || submissions.length === 0 ? (
        <div className="alert alert-info shadow-lg my-2">
          <div className="flex gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>No submissions found for this problem yet.</span>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto w-full bg-base-100 rounded-lg shadow border border-base-200">
            <table className="table table-zebra w-full text-sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Runtime</th>
                  <th>Memory</th>
                  <th>Test Cases</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, index) => (
                  <tr key={sub._id || index}>
                    <td>{index + 1}</td>
                    <td className="font-mono text-xs">{sub.language || 'cpp'}</td>
                    <td>
                      <span className={`badge ${getStatusColor(sub.status)} text-xs font-semibold`}>
                        {sub.status ? (sub.status.charAt(0).toUpperCase() + sub.status.slice(1)) : 'Unknown'}
                      </span>
                    </td>
                    <td className="font-mono text-xs">{sub.runtime ?? '0'} sec</td>
                    <td className="font-mono text-xs">{formatMemory(sub.memory)}</td>
                    <td className="font-mono text-xs">
                      {sub.testCasesPassed ?? 0}/{sub.testCasesTotal ?? 0}
                    </td>
                    <td className="text-xs">{formatDate(sub.createdAt)}</td>
                    <td>
                      <button 
                        className="btn btn-xs btn-outline btn-primary"
                        onClick={() => setSelectedSubmission(sub)}
                      >
                        Code
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500 italic">
            Showing {submissions.length} submission(s)
          </p>
        </>
      )}

      {/* Code View Modal */}
      {selectedSubmission && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-4xl bg-base-200">
            <h3 className="font-bold text-lg mb-2">
              Submission Code Details ({selectedSubmission.language})
            </h3>
            
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`badge ${getStatusColor(selectedSubmission.status)}`}>
                  {selectedSubmission.status}
                </span>
                <span className="badge badge-outline text-xs">
                  Runtime: {selectedSubmission.runtime ?? 0}s
                </span>
                <span className="badge badge-outline text-xs">
                  Memory: {formatMemory(selectedSubmission.memory)}
                </span>
                <span className="badge badge-outline text-xs">
                  Passed: {selectedSubmission.testCasesPassed ?? 0}/{selectedSubmission.testCasesTotal ?? 0}
                </span>
              </div>
              
              {selectedSubmission.errorMessage && (
                <div className="alert alert-error mt-2 p-2 text-xs">
                  <span><strong>Error Message:</strong> {selectedSubmission.errorMessage}</span>
                </div>
              )}
            </div>
            
            <pre className="p-4 bg-black text-green-400 rounded-lg overflow-x-auto text-xs font-mono max-h-96">
              <code>{selectedSubmission.code || '// No code found'}</code>
            </pre>
            
            <div className="modal-action">
              <button 
                className="btn btn-sm btn-ghost"
                onClick={() => setSelectedSubmission(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionHistory;