import { useState, useEffect } from 'react';
import {
  collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc, query, orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

function Dashboard({ user, userRole }) {
  const [eventi, setEventi] = useState([]);
  const [mojiEventi, setMojiEventi] = useState([]);
  const [kategorije, setKategorije] = useState([]);
  const [mojeUdruge, setMojeUdruge] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedKategorija, setSelectedKategorija] = useState('sve');

  const norm = v => (v || '').toString().trim().toLowerCase();
  const toDate = d => (d && typeof d.toDate === 'function') ? d.toDate() : new Date(d);

  useEffect(() => { if (user) fetchAllData(); }, [user]);

  useEffect(() => {
    const c = mojiEventi.length;
    setStats({
      ukupnoEventi: c,
      ukupnoSati: c * 4,
      aktivan: mojiEventi.some(e => toDate(e.datum) > new Date()),
      najčešćaKategorija: getMostFrequentCategory()
    });
  }, [mojiEventi]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchEventi(), fetchMojiEventi(), fetchKategorije(), fetchMojeUdruge()]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventi = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'eventi'), orderBy('datum', 'asc')));
      const data = await Promise.all(
        snap.docs.map(async ds => {
          const e = { id: ds.id, ...ds.data() };
          if (e.udrugaId) {
            const u = await getDoc(doc(db, 'udruge', e.udrugaId));
            if (u.exists()) e.udruga = u.data();
          }
          return e;
        })
      );
      setEventi(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMojiEventi = async () => {
    try {
      const snap = await getDocs(collection(db, 'eventi'));
      const data = await Promise.all(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(e => Array.isArray(e.volonteri) && e.volonteri.includes(user.uid))
          .map(async e => {
            if (e.udrugaId) {
              const u = await getDoc(doc(db, 'udruge', e.udrugaId));
              if (u.exists()) e.udruga = u.data();
            }
            return e;
          })
      );
      setMojiEventi(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchKategorije = async () => {
    try {
      const snap = await getDocs(collection(db, 'kategorije'));
      setKategorije(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMojeUdruge = async () => {
    try {
      const snap = await getDocs(collection(db, 'udruge'));
      setMojeUdruge(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.adminId === user.uid));
    } catch (e) {
      console.error(e);
    }
  };

  const getMostFrequentCategory = () => {
    const c = {};
    mojiEventi.forEach(e => { c[e.kategorija] = (c[e.kategorija] || 0) + 1; });
    let m = 0; let r = 'Nema podataka';
    Object.entries(c).forEach(([k, v]) => { if (v > m) { m = v; r = k; } });
    return r;
  };

  const prijaviSeZaEvent = async (eventId) => {
    setLoading(true);
    try {
      const ref = doc(db, 'eventi', eventId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const e = snap.data();
        const broj = Array.isArray(e.volonteri) ? e.volonteri.length : 0;
        if (broj < (e.maxVolonteri || 0)) {
          await updateDoc(ref, { volonteri: arrayUnion(user.uid), trenutnoVolonteri: broj + 1 });
          await Promise.all([fetchEventi(), fetchMojiEventi()]);
          const btn = document.getElementById(`btn-${eventId}`);
          if (btn) { btn.classList.add('animate-pulse', 'bg-green-500'); setTimeout(() => btn.classList.remove('animate-pulse', 'bg-green-500'), 1000); }
        } else {
          alert('🚫 Event je popunjen!');
        }
      }
    } catch (e) {
      console.error(e);
      alert('❌ Greška pri prijavi za event');
    } finally {
      setLoading(false);
    }
  };

  const odjaviSeOdEventa = async (eventId) => {
    if (!window.confirm('Sigurno se želiš odjaviti s ovog eventa?')) return;
    setLoading(true);
    try {
      const ref = doc(db, 'eventi', eventId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const e = snap.data();
        const broj = Array.isArray(e.volonteri) ? e.volonteri.length : 0;
        await updateDoc(ref, { volonteri: arrayRemove(user.uid), trenutnoVolonteri: Math.max(0, broj - 1) });
        await Promise.all([fetchEventi(), fetchMojiEventi()]);
      }
    } catch (e) {
      console.error(e);
      alert('❌ Greška pri odjavi s eventa');
    } finally {
      setLoading(false);
    }
  };

  const imaLiSeKorisnikPrijavio = e => Array.isArray(e.volonteri) && e.volonteri.includes(user.uid);

  const filtrirajEvente = () => {
    if (selectedKategorija === 'sve') return eventi;
    return eventi.filter(e => norm(e.kategorija) === norm(selectedKategorija));
  };

  const formatDatum = d => {
    if (!d) return '';
    const x = toDate(d);
    return x.toLocaleDateString('hr-HR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  };

  const getKategorijaInfo = naziv => {
    const k = kategorije.find(x => norm(x.naziv) === norm(naziv));
    return k || { boja: '#6B7280', ikona: '📌' };
  };

  if (loading && eventi.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavam tvoj dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center animate-fade-in-up">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Dobrodošli, {user?.email?.split('@')[0]}! 👋</h1>
          <p className="text-gray-600 text-lg">Uloga: <span className="font-semibold text-blue-600">{userRole}</span></p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg"><p className="text-blue-100">Moji eventi</p><p className="text-3xl font-bold">{stats.ukupnoEventi || 0}</p></div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg"><p className="text-green-100">Sati volontiranja</p><p className="text-3xl font-bold">{stats.ukupnoSati || 0}h</p></div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg"><p className="text-purple-100">Status</p><p className="text-lg font-bold">{stats.aktivan ? '🟢 Aktivan' : '⭕ Neaktivan'}</p></div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg"><p className="text-orange-100">Omiljena kategorija</p><p className="text-sm font-bold">{stats.najčešćaKategorija}</p></div>
        </div>

        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center"><span className="mr-3">🎯</span>Moji eventi ({mojiEventi.length})</h2>
          {mojiEventi.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mojiEventi.map((event, index) => {
                const k = getKategorijaInfo(event.kategorija);
                const isPast = toDate(event.datum) < new Date();
                return (
                  <div key={event.id} className={`rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition duration-300 overflow-hidden ${isPast ? 'bg-gray-100 opacity-75' : 'bg-white'}`} style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="h-32 flex items-center justify-center text-white relative overflow-hidden" style={{ backgroundColor: k.boja }}>
                      <div className="text-5xl">{k.ikona}</div>
                      <div className="absolute top-4 right-4">{isPast ? <span className="bg-black bg-opacity-30 px-2 py-1 rounded-full text-xs">Završeno</span> : <span className="bg-white bg-opacity-30 px-2 py-1 rounded-full text-xs">Aktivan</span>}</div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-3">{event.naziv}</h3>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-gray-500 text-sm"><span className="mr-2">📅</span><span>{formatDatum(event.datum)}</span></div>
                        <div className="flex items-center text-gray-500 text-sm"><span className="mr-2">📍</span><span>{event.lokacija}</span></div>
                        {event.udruga && <div className="flex items-center text-gray-500 text-sm"><span className="mr-2">🏢</span><span>{event.udruga.naziv}</span></div>}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="px-3 py-1 rounded-full text-white text-xs font-medium" style={{ backgroundColor: k.boja }}>{event.kategorija}</span>
                        <button onClick={() => odjaviSeOdEventa(event.id)} disabled={loading || isPast} className="bg-red-500 text-white px-3 py-1 rounded-full text-sm hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300">{isPast ? 'Završeno' : 'Odjavi se'}</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Nisi se prijavio/la za nijedan event</h3>
              <p className="text-gray-500 mb-6">Pronađi događaj koji te zanima i počni mijenjati svijet!</p>
              <a href="#dostupni-eventi" className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition duration-300">Pregledaj evente</a>
            </div>
          )}
        </section>

        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => setSelectedKategorija('sve')} className={`px-4 py-2 rounded-full transition duration-300 ${selectedKategorija === 'sve' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-blue-50 border'}`}>🌟 Sve kategorije</button>
            {kategorije.map(k => (
              <button key={k.id} onClick={() => setSelectedKategorija(norm(k.naziv))} className={`px-4 py-2 rounded-full transition duration-300 ${selectedKategorija === norm(k.naziv) ? 'text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`} style={{ backgroundColor: selectedKategorija === norm(k.naziv) ? k.boja : undefined }}>
                {k.ikona} {k.naziv}
              </button>
            ))}
          </div>
        </div>

        <section id="dostupni-eventi">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center"><span className="mr-3">🎪</span>Dostupni eventi ({filtrirajEvente().length})</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtrirajEvente().map((event, index) => {
              const prijavljen = Array.isArray(event.volonteri) ? event.volonteri.length : 0;
              const korisnikPrijavljen = imaLiSeKorisnikPrijavio(event);
              const k = getKategorijaInfo(event.kategorija);
              const isPast = toDate(event.datum) < new Date();
              const popunjen = prijavljen >= (event.maxVolonteri || 0);
              return (
                <div key={event.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition duration-300 overflow-hidden group" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="h-40 flex items-center justify-center text-white relative overflow-hidden" style={{ backgroundColor: k.boja }}>
                    <div className="text-5xl">{k.ikona}</div>
                    <div className="absolute top-4 right-4"><span className="bg-white bg-opacity-30 px-2 py-1 rounded-full text-xs">{event.kategorija}</span></div>
                    <div className="absolute bottom-4 left-4"><div className="text-xs bg-black bg-opacity-30 px-2 py-1 rounded-full">{prijavljen}/{event.maxVolonteri || 0} volontera</div></div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition duration-300">{event.naziv}</h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">{(event.opis || '').length > 100 ? (event.opis || '').substring(0, 100) + '...' : (event.opis || '')}</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-500 text-sm"><span className="mr-2">📅</span><span>{formatDatum(event.datum)} u {event.vrijeme || '10:00'}</span></div>
                      <div className="flex items-center text-gray-500 text-sm"><span className="mr-2">📍</span><span>{event.lokacija}</span></div>
                      {event.udruga && <div className="flex items-center text-gray-500 text-sm"><span className="mr-2">🏢</span><span>{event.udruga.naziv}</span></div>}
                    </div>
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-green-400 rounded-full transition-all duration-300" style={{ width: `${((prijavljen) / ((event.maxVolonteri || 1))) * 100}%` }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{Math.round(((prijavljen) / ((event.maxVolonteri || 1))) * 100)}% popunjeno</span>
                        <span>{(event.maxVolonteri || 0) - prijavljen} mjesta ostalo</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      {korisnikPrijavljen ? (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm font-medium"><span className="mr-1">✅</span>Prijavljen/a</span>
                          <button onClick={() => odjaviSeOdEventa(event.id)} disabled={loading || isPast} className="bg-red-500 text-white px-3 py-1 rounded-full text-xs hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300">Odjavi se</button>
                        </div>
                      ) : (
                        <button id={`btn-${event.id}`} onClick={() => prijaviSeZaEvent(event.id)} disabled={loading || popunjen || isPast} className={`px-4 py-2 rounded-full font-medium transition duration-300 transform hover:scale-105 ${popunjen || isPast ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-green-600 text-white hover:shadow-lg'}`}>
                          {loading ? (<span className="flex items-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Prijavljivanje...</span>) : popunjen ? '🚫 Popunjeno' : isPast ? '⏰ Završeno' : '🚀 Prijavi se'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtrirajEvente().length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Nema evenata u ovoj kategoriji</h3>
              <p className="text-gray-500 mb-6">Pokušaj s drugom kategorijom ili se vrati kasnije za nove evente</p>
              <button onClick={() => setSelectedKategorija('sve')} className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition duration-300">Prikaži sve evente</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
