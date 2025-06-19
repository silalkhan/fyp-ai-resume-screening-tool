import React, { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
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

  return (
    <Layout title="Manage Jobs">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4"
          role="alert"
        >
          <p>{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Job Descriptions</h2>
            <button className="btn-primary" onClick={handleAddJob}>
              Add New Job
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-600">
                No job descriptions found
              </h3>
              <p className="mt-2 text-gray-500">
                Create your first job description by clicking the "Add New Job"
                button.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left">Title</th>
                    <th className="py-3 px-4 text-left">Category</th>
                    <th className="py-3 px-4 text-left">Required Experience</th>
                    <th className="py-3 px-4 text-left">Created At</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr key={job._id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">{job.title}</td>
                      <td className="py-3 px-4">{job.category}</td>
                      <td className="py-3 px-4">
                        {job.requiredExperience > 0
                          ? `${job.requiredExperience} year(s)`
                          : "None"}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          className="text-blue-500 hover:text-blue-700 mr-3"
                          onClick={() => handleEditJob(job)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700"
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
          )}
        </div>
      )}

      {/* Job Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {editingJob ? "Edit Job Description" : "Add New Job Description"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="title"
                >
                  Job Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="category"
                >
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={4}
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="requiredSkills"
                >
                  Required Skills (comma-separated)
                </label>
                <input
                  type="text"
                  id="requiredSkills"
                  name="requiredSkills"
                  value={formData.requiredSkills}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="JavaScript, React, Node.js"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="preferredSkills"
                >
                  Preferred Skills (comma-separated)
                </label>
                <input
                  type="text"
                  id="preferredSkills"
                  name="preferredSkills"
                  value={formData.preferredSkills}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="TypeScript, Docker, AWS"
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="requiredExperience"
                >
                  Required Experience (years)
                </label>
                <input
                  type="number"
                  id="requiredExperience"
                  name="requiredExperience"
                  value={formData.requiredExperience}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="0"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  {editingJob ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ManageJobsPage;
