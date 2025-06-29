import React, { useState, useEffect } from "react";
import {
  getJobCategories,
  getJobDescriptions,
  createJobDescription,
  updateJobDescription,
  deleteJobDescription,
} from "../services/api";
import { JobDescription, JobCategory } from "../types";
import { toast } from "react-toastify";

const ManageJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingJob, setEditingJob] = useState<JobDescription | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    category: string;
    description: string;
    requiredSkills: string;
    preferredSkills: string;
    requiredExperience: number;
  }>({
    title: "",
    category: "",
    description: "",
    requiredSkills: "",
    preferredSkills: "",
    requiredExperience: 0,
  });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await getJobDescriptions();
      if (response.success) {
        setJobs(response.data);
      } else {
        setError(response.message || "Failed to fetch job descriptions");
      }
    } catch (err) {
      console.error("Error fetching job descriptions:", err);
      setError("Failed to load job descriptions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getJobCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error("Error fetching job categories:", err);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchCategories();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "requiredExperience" ? parseInt(value) || 0 : value,
    });
  };

  const handleAddJob = () => {
    setEditingJob(null);
    setFormData({
      title: "",
      category: categories.length > 0 ? categories[0].id : "",
      description: "",
      requiredSkills: "",
      preferredSkills: "",
      requiredExperience: 0,
    });
    setShowModal(true);
  };

  const handleEditJob = (job: JobDescription) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      category: job.category,
      description: job.description,
      requiredSkills: job.requiredSkills.join(", "),
      preferredSkills: job.preferredSkills.join(", "),
      requiredExperience: job.requiredExperience,
    });
    setShowModal(true);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (
      window.confirm("Are you sure you want to delete this job description?")
    ) {
      try {
        const response = await deleteJobDescription(jobId);
        if (response.success) {
          toast.success("Job description deleted successfully");
          fetchJobs(); // Refresh the job list
        } else {
          toast.error(response.message || "Failed to delete job description");
        }
      } catch (error) {
        console.error("Error deleting job:", error);
        toast.error("An error occurred while deleting the job description");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert comma-separated strings to arrays
    const requiredSkillsArray = formData.requiredSkills
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill !== "");

    const preferredSkillsArray = formData.preferredSkills
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill !== "");

    const jobData = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      requiredSkills: requiredSkillsArray,
      preferredSkills: preferredSkillsArray,
      requiredExperience: formData.requiredExperience,
    };

    try {
      let response;

      if (editingJob) {
        response = await updateJobDescription(editingJob._id, jobData);
      } else {
        response = await createJobDescription(jobData);
      }

      if (response.success) {
        toast.success(
          editingJob
            ? "Job description updated successfully"
            : "Job description created successfully"
        );
        setShowModal(false);
        fetchJobs(); // Refresh the job list
      } else {
        toast.error(response.message || "Failed to save job description");
      }
    } catch (error) {
      console.error("Error saving job:", error);
      toast.error("An error occurred while saving the job description");
    }
  };

  const renderJobForm = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="relative mx-auto p-6 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-900">
              {editingJob ? "Edit Job Description" : "Add New Job Description"}
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Job Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className="block w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Full Stack Developer"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700"
                >
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  className="block w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Job Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                className="block w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Describe the job role, responsibilities and requirements..."
              ></textarea>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="requiredSkills"
                className="block text-sm font-medium text-gray-700"
              >
                Required Skills (comma separated)
              </label>
              <input
                id="requiredSkills"
                name="requiredSkills"
                type="text"
                className="block w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.requiredSkills}
                onChange={handleInputChange}
                placeholder="e.g. JavaScript, React.js, Node.js, HTML, CSS, MongoDB"
              />
              <p className="text-sm text-gray-500">
                Enter skills separated by commas
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="preferredSkills"
                className="block text-sm font-medium text-gray-700"
              >
                Preferred Skills (comma separated)
              </label>
              <input
                id="preferredSkills"
                name="preferredSkills"
                type="text"
                className="block w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.preferredSkills}
                onChange={handleInputChange}
                placeholder="e.g. TypeScript, AWS, Docker, Redis, GraphQL"
              />
              <p className="text-sm text-gray-500">
                Enter additional preferred skills separated by commas
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="requiredExperience"
                className="block text-sm font-medium text-gray-700"
              >
                Required Experience (years)
              </label>
              <input
                id="requiredExperience"
                name="requiredExperience"
                type="number"
                min="0"
                className="block w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.requiredExperience}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {editingJob ? "Update Job" : "Add Job"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Jobs</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Job Descriptions</h2>
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={handleAddJob}
            >
              Add New Job
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No job descriptions found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first job description by clicking the "Add New Job"
                button.
              </p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Required Experience
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobs.map((job) => (
                      <tr key={job._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {job.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {job.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {job.requiredExperience > 0
                            ? `${job.requiredExperience} year(s)`
                            : "None"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            onClick={() => handleEditJob(job)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteJob(job._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      {renderJobForm()}
    </>
  );
};

export default ManageJobsPage;
