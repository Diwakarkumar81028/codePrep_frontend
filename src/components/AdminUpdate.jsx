import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';

const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'Easy', 'Medium', 'Hard']),
  tags: z.enum(['array', 'linkedlist', 'linkedList', 'graph', 'tree', 'dp']),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explanation: z.string().min(1, 'Explanation is required')
    })
  ).min(1, 'At least one visible test case required'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required')
    })
  ).min(1, 'At least one hidden test case required'),
  startCode: z.array(
    z.object({
      language: z.enum(['c++', 'java', 'javascript']),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ).length(3, 'All three languages required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['c++', 'java', 'javascript']),
      completeCode: z.string().min(1, 'Complete code is required')
    })
  ).length(3, 'All three languages required')
});

function AdminUpdate() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Yeh state manage karegi ki hum list dekh rahe hain ya edit form
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(problemSchema)
  });

  const { fields: visibleFields, append: appendVisible, remove: removeVisible } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  const { fields: hiddenFields, append: appendHidden, remove: removeHidden } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/problem/getall');
      if (Array.isArray(data)) {
        setProblems(data);
      } else if (data && Array.isArray(data.problems)) {
        setProblems(data.problems);
      } else if (data && Array.isArray(data.data)) {
        setProblems(data.data);
      } else {
        setProblems([]);
      }
    } catch (err) {
      setError('Failed to fetch problems');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (problem) => {
    setSelectedProblemId(problem._id);
    reset({
      title: problem.title || '',
      description: problem.description || '',
      difficulty: problem.difficulty?.toLowerCase() || 'easy',
      tags: problem.tags?.toLowerCase() === 'linked list' ? 'linkedlist' : problem.tags?.toLowerCase() || 'array',
      visibleTestCases: problem.visibleTestCases || [],
      hiddenTestCases: problem.hiddenTestCases || [],
      startCode: problem.startCode || [
        { language: 'c++', initialCode: '' },
        { language: 'java', initialCode: '' },
        { language: 'javascript', initialCode: '' }
      ],
      referenceSolution: problem.referenceSolution || [
        { language: 'c++', completeCode: '' },
        { language: 'java', completeCode: '' },
        { language: 'javascript', completeCode: '' }
      ]
    });
  };

  const onSubmit = async (formData) => {
    try {
      setSubmitLoading(true);
      await axiosClient.put(`/problem/update/${selectedProblemId}`, formData);
      alert('Problem updated successfully!');
      setSelectedProblemId(null); // Form close karke wapas list par jaane ke liye
      fetchProblems(); // List ko update karne ke liye refresh hit karenge
    } catch (error) {
      console.error(error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error shadow-lg my-4">
        <div><span>{error}</span></div>
      </div>
    );
  }

  if (selectedProblemId) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Update Problem Details</h1>
          <button 
            type="button" 
            onClick={() => setSelectedProblemId(null)} 
            className="btn btn-sm btn-outline"
          >
            Back to List
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="card bg-base-100 shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Title</span></label>
                <input {...register('title')} className={`input input-bordered ${errors.title && 'input-error'}`} />
                {errors.title && <span className="text-error">{errors.title.message}</span>}
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Description</span></label>
                <textarea {...register('description')} className={`textarea textarea-bordered h-32 ${errors.description && 'textarea-error'}`} />
                {errors.description && <span className="text-error">{errors.description.message}</span>}
              </div>

              <div className="flex gap-4">
                <div className="form-control w-1/2">
                  <label className="label"><span className="label-text">Difficulty</span></label>
                  <select {...register('difficulty')} className="select select-bordered">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className="form-control w-1/2">
                  <label className="label"><span className="label-text">Tag</span></label>
                  <select {...register('tags')} className="select select-bordered">
                    <option value="array">Array</option>
                    <option value="linkedlist">Linked List</option>
                    <option value="graph">Graph</option>
                    <option value="tree">Tree</option>
                    <option value="dp">DP</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Test Cases */}
          <div className="card bg-base-100 shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Cases</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Visible Test Cases</h3>
                <button type="button" onClick={() => appendVisible({ input: '', output: '', explanation: '' })} className="btn btn-sm btn-primary">Add Visible Case</button>
              </div>
              {visibleFields.map((field, index) => (
                <div key={field.id} className="border p-4 rounded-lg space-y-2">
                  <div className="flex justify-end">
                    <button type="button" onClick={() => removeVisible(index)} className="btn btn-xs btn-error">Remove</button>
                  </div>
                  <input {...register(`visibleTestCases.${index}.input`)} placeholder="Input" className="input input-bordered w-full" />
                  <input {...register(`visibleTestCases.${index}.output`)} placeholder="Output" className="input input-bordered w-full" />
                  <textarea {...register(`visibleTestCases.${index}.explanation`)} placeholder="Explanation" className="textarea textarea-bordered w-full" />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Hidden Test Cases</h3>
                <button type="button" onClick={() => appendHidden({ input: '', output: '' })} className="btn btn-sm btn-primary">Add Hidden Case</button>
              </div>
              {hiddenFields.map((field, index) => (
                <div key={field.id} className="border p-4 rounded-lg space-y-2">
                  <div className="flex justify-end">
                    <button type="button" onClick={() => removeHidden(index)} className="btn btn-xs btn-error">Remove</button>
                  </div>
                  <input {...register(`hiddenTestCases.${index}.input`)} placeholder="Input" className="input input-bordered w-full" />
                  <input {...register(`hiddenTestCases.${index}.output`)} placeholder="Output" className="input input-bordered w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Code Templates */}
          <div className="card bg-base-100 shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Code Templates</h2>
            <div className="space-y-6">
              {[0, 1, 2].map((index) => (
                <div key={index} className="space-y-2">
                  <h3 className="font-medium">{index === 0 ? 'C++' : index === 1 ? 'Java' : 'JavaScript'}</h3>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Initial Code</span></label>
                    <pre className="bg-base-300 p-4 rounded-lg">
                      <textarea {...register(`startCode.${index}.initialCode`)} className="w-full bg-transparent font-mono" rows={6} />
                    </pre>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Reference Solution</span></label>
                    <pre className="bg-base-300 p-4 rounded-lg">
                      <textarea {...register(`referenceSolution.${index}.completeCode`)} className="w-full bg-transparent font-mono" rows={6} />
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={submitLoading} className="btn btn-primary w-full">
            {submitLoading ? <span className="loading loading-spinner"></span> : 'Update Problem'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Select Problem to Update</h1>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th className="w-1/12">#</th>
              <th className="w-5/12">Title</th>
              <th className="w-2/12">Difficulty</th>
              <th className="w-2/12">Tags</th>
              <th className="w-2/12">Actions</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem, index) => (
              <tr key={problem._id}>
                <th>{index + 1}</th>
                <td>{problem.title}</td>
                <td>
                  <span className={`badge ${
                    problem.difficulty === 'Easy' || problem.difficulty === 'easy'
                      ? 'badge-success' 
                      : problem.difficulty === 'Medium' || problem.difficulty === 'medium'
                        ? 'badge-warning' 
                        : 'badge-error'
                  }`}>
                    {problem.difficulty}
                  </span>
                </td>
                <td>
                  <span className="badge badge-outline">
                    {problem.tags}
                  </span>
                </td>
                <td>
                  <div className="flex space-x-2">
                    {/* EDIT ACTION: State set karega bina page change kiye */}
                    <button 
                      onClick={() => handleEditClick(problem)}
                      className="btn btn-sm btn-warning text-white"
                    >
                      Update
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUpdate;