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
        <div className="relative mx-auto p-6 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 max-h-[90vh] overflow-y-auto transition-colors duration-300">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {editingJob ? "Edit Job Description" : "Add New Job Description"}
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
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
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Job Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className="block w-full px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Full Stack Developer"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  className="block w-full px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
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
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Job Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                className="block w-full px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Describe the job responsibilities and requirements..."
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="requiredSkills"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Required Skills
                </label>
                <input
                  id="requiredSkills"
                  name="requiredSkills"
                  type="text"
                  className="block w-full px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
                  value={formData.requiredSkills}
                  onChange={handleInputChange}
                  placeholder="e.g. JavaScript, React, Node.js"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Separate skills with commas
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="preferredSkills"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Preferred Skills
                </label>
                <input
                  id="preferredSkills"
                  name="preferredSkills"
                  type="text"
                  className="block w-full px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
                  value={formData.preferredSkills}
                  onChange={handleInputChange}
                  placeholder="e.g. TypeScript, AWS, Docker"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Separate skills with commas
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="requiredExperience"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Required Experience (years)
              </label>
              <input
                id="requiredExperience"
                name="requiredExperience"
                type="number"
                min="0"
                className="block w-full px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
                value={formData.requiredExperience}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-primary-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 dark:bg-primary-700 hover:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-primary-400"
              >
                {editingJob ? "Update Job" : "Create Job"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Manage Jobs
        </h1>
        <button
          onClick={handleAddJob}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 dark:bg-primary-700 hover:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-primary-400"
        >
          Add New Job
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-lg text-center transition-colors duration-300">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
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
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
            No Jobs Found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new job description.
          </p>
          <div className="mt-6">
            <button
              onClick={handleAddJob}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 dark:bg-primary-700 hover:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-primary-400"
            >
              Add New Job
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow dark:shadow-lg overflow-hidden rounded-lg transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Required Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Required Skills
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {jobs.map((job) => (
                  <tr
                    key={job._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                      {job.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                      {job.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                      {job.requiredExperience > 0
                        ? `${job.requiredExperience} year(s)`
                        : "None"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {job.requiredSkills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.requiredSkills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs rounded-full">
                            +{job.requiredSkills.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditJob(job)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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

      {renderJobForm()}
    </>
  );
};

export default ManageJobsPage;
