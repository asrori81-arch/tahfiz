import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, 
  BookOpen, 
  User, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  Plus,
  Send,
  Award,
  List,
  Search,
  Book
} from 'lucide-react';
import { JUZ_30_SURAHS } from './constants';

// --- Types ---
interface UserData {
  id: string;
  name: string;
  role: 'siswa' | 'guru';
}

interface Request {
  id: number;
  student_id: string;
  student_name: string;
  teacher_id: string;
  surah_name: string;
  status: string;
  request_date: string;
}

interface Grade {
  id: number;
  student_name: string;
  teacher_name: string;
  surah_name: string;
  score: number;
  notes: string;
  grade_date: string;
}

// --- Components ---

const Login = ({ onLogin }: { onLogin: (user: UserData) => void }) => {
  const [role, setRole] = useState<'siswa' | 'guru'>('siswa');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password, role }),
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-stone-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200"
      >
        <div className="p-8 text-center bg-emerald-900 text-white">
          <div className="w-20 h-20 bg-white/10 rounded-2xl mx-auto mb-4 flex items-center justify-center backdrop-blur-sm border border-white/20">
            <BookOpen className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-serif font-bold italic">Tahfidz Juz 30</h1>
          <p className="text-emerald-200/80 text-sm mt-1">Sistem Penilaian Hafalan Quran</p>
        </div>

        <div className="p-8">
          <div className="flex bg-stone-100 p-1 rounded-xl mb-6">
            <button 
              onClick={() => setRole('siswa')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${role === 'siswa' ? 'bg-white shadow-sm text-emerald-700' : 'text-stone-500'}`}
            >
              Siswa
            </button>
            <button 
              onClick={() => setRole('guru')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${role === 'guru' ? 'bg-white shadow-sm text-emerald-700' : 'text-stone-500'}`}
            >
              Guru/Penguji
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
                {role === 'siswa' ? 'NISN' : 'ID Guru'}
              </label>
              <input 
                type="text" 
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder={role === 'siswa' ? 'Masukkan NISN' : 'Masukkan ID Guru'}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const StudentDashboard = ({ user, onLogout }: { user: UserData, onLogout: () => void }) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSurah, setSelectedSurah] = useState('');
  const [history, setHistory] = useState<Grade[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'surah' | 'leger'>('dashboard');
  const [viewingSurah, setViewingSurah] = useState(JUZ_30_SURAHS[0]);

  useEffect(() => {
    fetch('/api/teachers').then(res => res.json()).then(setTeachers);
    fetch(`/api/history/${user.id}`).then(res => res.json()).then(setHistory);
  }, [user.id]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !selectedSurah) return;
    
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user.id, teacherId: selectedTeacher, surahName: selectedSurah }),
      });
      if (res.ok) {
        alert('Pengajuan berhasil dikirim!');
        setSelectedSurah('');
        setSelectedTeacher('');
      }
    } catch (err) {
      alert('Gagal mengirim pengajuan');
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50">
      {/* Sidebar/Nav */}
      <nav className="bg-emerald-900 text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="font-serif italic font-bold text-xl">Tahfidz Siswa</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-emerald-300 uppercase font-bold tracking-tighter">Siswa</p>
              <p className="text-sm font-medium">{user.name}</p>
            </div>
            <button onClick={onLogout} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 sm:p-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: User },
            { id: 'surah', label: 'Baca Surah', icon: Book },
            { id: 'leger', label: 'Leger Nilai', icon: List },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id 
                ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-900/20' 
                : 'bg-white text-emerald-900 hover:bg-emerald-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Request Form */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100">
                  <h2 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Ajukan Setoran
                  </h2>
                  <form onSubmit={handleRequest} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Pilih Surah</label>
                      <select 
                        value={selectedSurah}
                        onChange={(e) => setSelectedSurah(e.target.value)}
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        <option value="">-- Pilih Surah --</option>
                        {JUZ_30_SURAHS.map(s => (
                          <option key={s.id} value={s.name}>{s.name} ({s.verses} Ayat)</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Pilih Penguji</label>
                      <select 
                        value={selectedTeacher}
                        onChange={(e) => setSelectedTeacher(e.target.value)}
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        <option value="">-- Pilih Penguji --</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md">
                      Kirim Pengajuan
                    </button>
                  </form>
                </div>
              </div>

              {/* History */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 h-full">
                  <h2 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Riwayat Setoran
                  </h2>
                  <div className="space-y-3">
                    {history.length === 0 ? (
                      <div className="text-center py-12 text-stone-400">
                        <p>Belum ada riwayat setoran.</p>
                      </div>
                    ) : (
                      history.map(h => (
                        <div key={h.id} className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <div>
                            <p className="font-bold text-emerald-900">{h.surah_name}</p>
                            <p className="text-xs text-stone-500">Penguji: {h.teacher_name}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-serif font-bold text-emerald-700">{h.score}</div>
                            <p className="text-[10px] text-stone-400 uppercase font-bold">{new Date(h.grade_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'surah' && (
            <motion.div 
              key="surah"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <h2 className="text-xl font-serif italic font-bold text-emerald-900">Murottal Juz 30</h2>
                <select 
                  className="p-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  onChange={(e) => {
                    const s = JUZ_30_SURAHS.find(surah => surah.name === e.target.value);
                    if (s) setViewingSurah(s);
                  }}
                  value={viewingSurah.name}
                >
                  {JUZ_30_SURAHS.map(s => (
                    <option key={s.id} value={s.name}>{s.id}. {s.name}</option>
                  ))}
                </select>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="p-8 bg-emerald-900 text-white rounded-3xl text-center">
                    <h3 className="text-4xl font-serif italic mb-2">{viewingSurah.name}</h3>
                    <p className="text-emerald-300 uppercase tracking-widest text-xs font-bold">{viewingSurah.verses} Ayat</p>
                  </div>
                  <div className="prose prose-stone max-w-none">
                    <p className="text-stone-600 leading-relaxed italic">
                      "Bacalah Al-Qur'an, karena sesungguhnya ia akan datang pada hari kiamat sebagai pemberi syafaat bagi pembacanya." (HR. Muslim)
                    </p>
                  </div>
                </div>
                <div className="bg-stone-50 p-8 rounded-3xl border border-stone-100 flex items-center justify-center min-h-[300px]">
                  <div className="text-center space-y-4">
                    <Book className="w-16 h-16 text-emerald-200 mx-auto" />
                    <p className="text-stone-400 font-medium">Tampilan teks Arab akan muncul di sini (Integrasi API Quran)</p>
                    <p className="text-xs text-stone-300">Surah: {viewingSurah.name}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'leger' && (
            <LegerTable />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const TeacherDashboard = ({ user, onLogout }: { user: UserData, onLogout: () => void }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'leger'>('requests');
  const [scoringRequest, setScoringRequest] = useState<Request | null>(null);
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');

  const fetchRequests = () => {
    fetch(`/api/requests/pending/${user.id}`).then(res => res.json()).then(setRequests);
  };

  useEffect(() => {
    fetchRequests();
  }, [user.id]);

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoringRequest) return;

    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: scoringRequest.id,
          studentId: scoringRequest.student_id,
          teacherId: user.id,
          surahName: scoringRequest.surah_name,
          score: parseInt(score),
          notes
        }),
      });
      if (res.ok) {
        alert('Nilai berhasil disimpan!');
        setScoringRequest(null);
        setScore('');
        setNotes('');
        fetchRequests();
      }
    } catch (err) {
      alert('Gagal menyimpan nilai');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-stone-900 text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <span className="font-serif italic font-bold text-xl">Panel Penguji</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-stone-400 uppercase font-bold tracking-tighter">Penguji</p>
              <p className="text-sm font-medium">{user.name}</p>
            </div>
            <button onClick={onLogout} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 sm:p-8">
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all ${
              activeTab === 'requests' 
              ? 'bg-stone-800 text-white shadow-lg' 
              : 'bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            Antrean Ujian
          </button>
          <button
            onClick={() => setActiveTab('leger')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all ${
              activeTab === 'leger' 
              ? 'bg-stone-800 text-white shadow-lg' 
              : 'bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            <List className="w-4 h-4" />
            Leger Nilai
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'requests' && (
            <motion.div 
              key="requests"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 gap-4"
            >
              {requests.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                  <Search className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                  <p className="text-stone-400 font-medium">Belum ada siswa yang mengajukan ujian.</p>
                </div>
              ) : (
                requests.map(req => (
                  <div key={req.id} className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900">{req.student_name}</h3>
                        <p className="text-sm text-stone-500">Surah: <span className="font-semibold text-emerald-700">{req.surah_name}</span></p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setScoringRequest(req)}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all"
                    >
                      Input Nilai
                    </button>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'leger' && (
            <LegerTable />
          )}
        </AnimatePresence>
      </main>

      {/* Scoring Modal */}
      <AnimatePresence>
        {scoringRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-stone-900 text-white flex justify-between items-center">
                <h3 className="font-bold">Input Nilai Tahfidz</h3>
                <button onClick={() => setScoringRequest(null)} className="p-1 hover:bg-white/10 rounded-lg">
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>
              <form onSubmit={handleSubmitGrade} className="p-6 space-y-4">
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 mb-4">
                  <p className="text-xs text-stone-400 uppercase font-bold">Siswa</p>
                  <p className="font-bold text-stone-900">{scoringRequest.student_name}</p>
                  <p className="text-xs text-stone-400 uppercase font-bold mt-2">Surah</p>
                  <p className="font-bold text-emerald-700">{scoringRequest.surah_name}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Nilai (0-100)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: 85"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Catatan/Feedback</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 h-24 resize-none"
                    placeholder="Masukkan catatan jika ada..."
                  />
                </div>
                <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg transition-all">
                  Simpan Nilai
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LegerTable = () => {
  const [leger, setLeger] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leger').then(res => res.json()).then(data => {
      setLeger(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-20">Memuat data...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden"
    >
      <div className="p-6 border-b border-stone-100">
        <h2 className="text-xl font-bold text-stone-900">Leger Nilai Keseluruhan</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 text-stone-400 text-xs uppercase font-bold tracking-wider">
              <th className="px-6 py-4">Tanggal</th>
              <th className="px-6 py-4">Siswa</th>
              <th className="px-6 py-4">Surah</th>
              <th className="px-6 py-4">Penguji</th>
              <th className="px-6 py-4 text-center">Nilai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {leger.map(item => (
              <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-6 py-4 text-sm text-stone-500">
                  {new Date(item.grade_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 font-medium text-stone-900">{item.student_name}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                    {item.surah_name}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-stone-600">{item.teacher_name}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-lg font-serif font-bold ${item.score >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {item.score}
                  </span>
                </td>
              </tr>
            ))}
            {leger.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-stone-400">Belum ada data nilai.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return user.role === 'siswa' 
    ? <StudentDashboard user={user} onLogout={handleLogout} /> 
    : <TeacherDashboard user={user} onLogout={handleLogout} />;
}
