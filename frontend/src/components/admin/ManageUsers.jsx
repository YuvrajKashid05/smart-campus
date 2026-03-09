import { useEffect, useState } from "react";
import * as usersService from "../../services/users";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "STUDENT",
    department: "",
    semester: "1",
  });

  const roles = ["STUDENT", "FACULTY", "ADMIN"];
  const departments = [
    "Computer Science",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Information Technology",
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole]);

  const fetchUsers = async () => {
    try {
      const data = await usersService.getAllUsers({ limit: 1000 });
      setUsers(data?.data || []);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch users");
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (filterRole !== "ALL") {
      filtered = filtered.filter((u) => u.role === filterRole);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredUsers(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await usersService.updateUser(editingId, formData);
        setSuccess("✅ User updated successfully!");
      } else {
        await usersService.createUser(formData);
        setSuccess("✅ User created successfully!");
      }

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "STUDENT",
        department: "",
        semester: "1",
      });

      setShowForm(false);
      setEditingId(null);
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
      role: user.role,
      department: user.department,
      semester: user.semester || "1",
    });
    setEditingId(user._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await usersService.deleteUser(id);
        setSuccess("✅ User deleted successfully!");
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError("Failed to delete user");
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "STUDENT",
      department: "",
      semester: "1",
    });
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await usersService.toggleUserStatus(id);
      setSuccess(`✅ User ${currentStatus ? "deactivated" : "activated"}!`);
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to toggle user status");
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              👥 Manage Users
            </h1>
            <p className="text-gray-600 mt-2">
              Total users: {filteredUsers.length}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? "✕ Close" : "➕ Add User"}
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingId ? "✏️ Edit User" : "➕ Add New User"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.role === "STUDENT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {loading
                    ? "⏳ Saving..."
                    : editingId
                      ? "✅ Update"
                      : "➕ Create"}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 transition"
                >
                  ✕ Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <input
                type="text"
                placeholder="Name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Role
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ALL">All Roles</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterRole("ALL");
                }}
                className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition"
              >
                🔄 Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Name</th>
                    <th className="px-6 py-3 text-left font-semibold">Email</th>
                    <th className="px-6 py-3 text-left font-semibold">Role</th>
                    <th className="px-6 py-3 text-left font-semibold">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left font-semibold">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <p className="font-semibold">
                          {user.firstName} {user.lastName}
                        </p>
                      </td>
                      <td className="px-6 py-3">{user.email}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.role === "STUDENT"
                              ? "bg-blue-100 text-blue-800"
                              : user.role === "FACULTY"
                                ? "bg-green-100 text-green-800"
                                : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-3">{user.department || "-"}</td>
                      <td className="px-6 py-3 text-xs text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">👤</p>
              <p className="text-gray-600">
                No users found. Create one to get started!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
