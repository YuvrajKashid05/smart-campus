import { useContext, useEffect, useRef, useState } from "react";
import { MdCheckCircle, MdError, MdQrCode2, MdTimer } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import * as attendanceService from "../../services/attendance";

const GenerateQRAttendance = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    course: "",
    dept: user?.dept || "",
    section: "",
    semester: "",
    ttlMinutes: "10",
  });
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleGenerateQR = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    clearInterval(intervalRef.current);

    try {
      const result = await attendanceService.startSession({
        course: formData.course,
        dept: formData.dept,
        section: formData.section,
        semester: formData.semester ? parseInt(formData.semester) : 0,
        ttlMinutes: parseInt(formData.ttlMinutes),
      });

      if (result.ok) {
        setSession(result.session);
        const restrictions = [];
        if (formData.dept)
          restrictions.push(`Dept: ${formData.dept.toUpperCase()}`);
        if (formData.section)
          restrictions.push(`Section: ${formData.section.toUpperCase()}`);
        if (formData.semester) restrictions.push(`Sem: ${formData.semester}`);
        setSuccess(
          `QR session started! Valid for ${formData.ttlMinutes} min. ${restrictions.length ? `Restricted to: ${restrictions.join(", ")}` : "Open to all."}`,
        );

        let seconds = parseInt(formData.ttlMinutes) * 60;
        setTimeLeft(seconds);
        intervalRef.current = setInterval(() => {
          seconds--;
          setTimeLeft(seconds);
          if (seconds <= 0) {
            clearInterval(intervalRef.current);
            setSession(null);
            setTimeLeft(null);
            setSuccess("");
            setError("QR session expired. Generate a new one.");
          }
        }, 1000);
      } else {
        setError(result.error || "Failed to generate QR session");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate QR session");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (sec) => {
    if (sec == null) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const qrImageUrl = session?.qrToken
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(session.qrToken)}&size=260x260&margin=10&color=1e293b`
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <MdQrCode2 className="text-blue-500" /> Generate QR Attendance
        </h1>
        <p className="text-gray-500 mb-8 text-sm">
          Set department, section and semester to restrict who can mark this
          attendance.
        </p>

        {error && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4">
            <MdError className="text-red-500 shrink-0" size={20} />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-4">
            <MdCheckCircle className="text-green-500 shrink-0" size={20} />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              Session Details
            </h2>
            <form onSubmit={handleGenerateQR} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course / Subject *
                </label>
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  placeholder="e.g., Data Structures"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Restriction fields */}
              <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 space-y-3">
                <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">
                  🔒 Access Restrictions — only matching students can mark
                  attendance
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department{" "}
                    <span className="text-gray-400 font-normal">
                      (required)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="dept"
                    value={formData.dept}
                    onChange={handleInputChange}
                    placeholder="e.g., CS"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      placeholder="e.g., A"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Semester{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="">Any</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Sem {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-xs text-orange-600">
                  Leave Section / Semester blank to allow all sections/semesters
                  within the department.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <select
                  name="ttlMinutes"
                  value={formData.ttlMinutes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-semibold"
              >
                <MdQrCode2 size={18} />
                {loading ? "Generating…" : "Generate QR Code"}
              </button>
            </form>
          </div>

          {/* QR Display */}
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center">
            {session ? (
              <>
                <div className="mb-4 p-3 bg-white rounded-xl border-2 border-gray-200 shadow-inner">
                  <img
                    src={qrImageUrl}
                    alt="QR Code"
                    width={260}
                    height={260}
                    className="rounded"
                  />
                </div>

                {/* Restriction badges */}
                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                  {session.dept && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                      Dept: {session.dept}
                    </span>
                  )}
                  {session.section && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                      Section: {session.section}
                    </span>
                  )}
                  {session.semester > 0 && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                      Sem: {session.semester}
                    </span>
                  )}
                </div>

                {timeLeft != null && (
                  <div className="text-center mb-4 w-full">
                    <div
                      className={`flex items-center gap-2 justify-center text-3xl font-bold ${timeLeft < 60 ? "text-red-600" : "text-blue-600"}`}
                    >
                      <MdTimer size={30} />
                      {formatTime(timeLeft)}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Time remaining</p>
                    <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${timeLeft < 60 ? "bg-red-500" : "bg-blue-500"}`}
                        style={{
                          width: `${(timeLeft / (parseInt(formData.ttlMinutes) * 60)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="w-full bg-blue-50 rounded-lg p-3 text-center text-sm">
                  <p className="font-bold text-blue-900">{session.course}</p>
                  <p className="text-xs text-blue-500 mt-1">
                    Expires: {new Date(session.expiresAt).toLocaleTimeString()}
                  </p>
                </div>

                <div className="w-full mt-3">
                  <p className="text-xs text-gray-400 mb-1 text-center">
                    Token (for manual entry)
                  </p>
                  <p className="font-mono text-xs bg-gray-100 p-2 rounded border border-gray-200 break-all select-all text-center">
                    {session.qrToken}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center">
                <MdQrCode2 className="text-gray-200 mx-auto mb-4" size={100} />
                <p className="text-gray-500 font-medium">
                  QR code will appear here
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Fill in the form and click Generate
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateQRAttendance;
