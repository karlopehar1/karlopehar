// src/pages/Homepage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  limit,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

function Homepage() {
  const [udruge, setUdruge] = useState([]);
  const [eventi, setEventi] = useState([]);
  const [kategorije, setKategorije] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKategorija, setSelectedKategorija] = useState('sve');

  // helpers (robustno)
  const norm = (v) => (v || '').toString().trim().toLowerCase();
  const toDate = (d) => (d && typeof d.toDate === 'function') ? d.toDate() : new Date(d || Date.now());

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  const fetchData = async () => {
    try {
      // Kategorije
      const kategorijeSnap = await getDocs(collection(db, 'kategorije'));
      const kategorijeData = kategorijeSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setKategorije(kategorijeData);

      // Udruge: prvo pokušaj aktivne, ako nema, fallback na prvih 6
      let udrugeDocs = [];
      try {
        const qAktivne = query(collection(db, 'udruge'), where('aktivna', '==', true), limit(6));
        const s = await getDocs(qAktivne);
        udrugeDocs = s.docs;
      } catch (_) { /* ignore */ }
      if (udrugeDocs.length === 0) {
        const sAll = await getDocs(query(collection(db, 'udruge'), limit(6)));
        udrugeDocs = sAll.docs;
      }
      const udrugeData = await Promise.all(
        udrugeDocs.map(async (docSnap) => {
          const u = { id: docSnap.id, ...docSnap.data() };
          if (u.adminId) {
            const a = await getDoc(doc(db, 'users', u.adminId));
            if (a.exists()) u.admin = a.data();
          }
          return u;
        })
      );
      setUdruge(udrugeData);

      // Eventi (nadolazeći)
      const eventiQuery = query(collection(db, 'eventi'), orderBy('datum', 'asc'), limit(9));
      const eventiSnap = await getDocs(eventiQuery);
      const eventiData = await Promise.all(
        eventiSnap.docs.map(async (docSnap) => {
          const e = { id: docSnap.id, ...docSnap.data() };
          if (e.udrugaId) {
            const udr = await getDoc(doc(db, 'udruge', e.udrugaId));
            if (udr.exists()) e.udruga = udr.data();
          }
          return e;
        })
      );
      setEventi(eventiData);
    } catch (error) {
      console.error('Greška pri dohvaćanju podataka:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrirajEvente = () => {
    if (selectedKategorija === 'sve') return eventi;
    return eventi.filter((e) => norm(e.kategorija) === norm(selectedKategorija));
  };

  const getKategorijaColor = (kategorija) => {
    const kat = kategorije.find((k) => norm(k.naziv) === norm(kategorija));
    return kat ? kat.boja : '#6B7280';
  };

  const formatDatum = (datum) => {
    if (!datum) return '';
    const date = toDate(datum);
    return date.toLocaleDateString('hr-HR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative container mx-auto px-4 py-20 text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Volontiranje HR
              <span className="block text-2xl md:text-3xl font-light mt-2 opacity-90">🌟 Mijenjamo svijet zajedno 🌟</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              Pronađi svoje mjesto u volonterskim aktivnostima i pomozi zajednici kroz značajne projekte
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* Smooth scroll na #eventi bez reloada */}
              <button
                type="button"
                onClick={() => handleScrollTo('eventi')}
                className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-blue-50 transform hover:scale-105 transition duration-300 shadow-lg"
              >
                🎯 Pregledaj evente
              </button>

              {/* SPA navigacija */}
              <Link
                to="/register"
                className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-blue-600 transform hover:scale-105 transition duration-300"
              >
                🚀 Pridruži se
              </Link>
            </div>
          </div>
        </div>

        {/* Dekoracija */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-white opacity-10 rounded-full animate-bounce"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-white opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white opacity-10 rounded-full animate-ping"></div>
        </div>
      </div>

      {/* Statistike */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="p-6 rounded-lg bg-blue-50 hover:bg-blue-100 transform hover:scale-105 transition duration-300">
              <div className="text-3xl font-bold text-blue-600 mb-2">{eventi.length}+</div>
              <div className="text-gray-600">Aktivnih evenata</div>
            </div>
            <div className="p-6 rounded-lg bg-green-50 hover:bg-green-100 transform hover:scale-105 transition duration-300">
              <div className="text-3xl font-bold text-green-600 mb-2">{udruge.length}+</div>
              <div className="text-gray-600">Partnera udruga</div>
            </div>
            <div className="p-6 rounded-lg bg-purple-50 hover:bg-purple-100 transform hover:scale-105 transition duration-300">
              <div className="text-3xl font-bold text-purple-600 mb-2">500+</div>
              <div className="text-gray-600">Aktivnih volontera</div>
            </div>
            <div className="p-6 rounded-lg bg-orange-50 hover:bg-orange-100 transform hover:scale-105 transition duration-300">
              <div className="text-3xl font-bold text-orange-600 mb-2">1200+</div>
              <div className="text-gray-600">Sati volontiranja</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter kategorija */}
      <div className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setSelectedKategorija('sve')}
              className={`px-4 py-2 rounded-full transition duration-300 ${
                selectedKategorija === 'sve'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-blue-50 border'
              }`}
            >
              🌟 Sve kategorije
            </button>
            {kategorije.map((k) => (
              <button
                key={k.id}
                onClick={() => setSelectedKategorija(norm(k.naziv))}
                className={`px-4 py-2 rounded-full transition duration-300 ${
                  selectedKategorija === norm(k.naziv)
                    ? 'text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border'
                }`}
                style={{
                  backgroundColor:
                    selectedKategorija === norm(k.naziv) ? k.boja : undefined
                }}
              >
                {k.ikona} {k.naziv}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nadolazeći eventi */}
      <section id="eventi" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">🎯 Nadolazeći eventi</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Pronađi savršen event za sebe i počni mijenjati svijet već danas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtrirajEvente().map((event, index) => {
              const prijavljen = Array.isArray(event.volonteri) ? event.volonteri.length : 0;
              const max = event.maxVolonteri || 0;
              const denom = Math.max(1, max);
              const postotak = Math.round(( (event.trenutnoVolonteri ?? prijavljen) / denom) * 100);

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition duration-300 overflow-hidden group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Header / slika */}
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-green-400 relative overflow-hidden">
                    {event.slika ? (
                      <img src={event.slika} alt={event.naziv} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                        {norm(event.kategorija) === 'ekologija' ? '🌱' :
                         norm(event.kategorija) === 'humanitarno' ? '❤️' :
                         norm(event.kategorija) === 'obrazovanje' ? '📚' : '🤝'}
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span
                        className="px-3 py-1 rounded-full text-white text-sm font-medium"
                        style={{ backgroundColor: getKategorijaColor(event.kategorija) }}
                      >
                        {event.kategorija}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition duration-300">
                      {event.naziv}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {(event.opis || '').length > 100 ? (event.opis || '').substring(0, 100) + '...' : (event.opis || '')}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-500">
                        <span className="mr-2">📅</span>
                        <span className="text-sm">
                          {formatDatum(event.datum)} u {event.vrijeme || '10:00'}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <span className="mr-2">📍</span>
                        <span className="text-sm">{event.lokacija}</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <span className="mr-2">👥</span>
                        <span className="text-sm">
                          {(event.trenutnoVolonteri ?? prijavljen)}/{max} volontera
                        </span>
                      </div>
                      {event.udruga && (
                        <div className="flex items-center text-gray-500">
                          <span className="mr-2">🏢</span>
                          <span className="text-sm">{event.udruga.naziv}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 h-1 bg-gradient-to-r from-blue-400 to-green-400 rounded-full mr-2"></div>
                        <span className="text-xs text-gray-500">{postotak}% popunjeno</span>
                      </div>
                      <Link
                        to="/login"
                        className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transform hover:scale-105 transition duration-300"
                      >
                        Prijavi se
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtrirajEvente().length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 text-lg">Nema evenata u ovoj kategoriji</p>
            </div>
          )}
        </div>
      </section>

      {/* Aktivne udruge */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">🏢 Partneri udruge</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">Upoznaj organizacije koje čine razliku u zajednici</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {udruge.map((udruga, index) => (
              <div
                key={udruga.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition duration-300 p-6 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-green-400 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 overflow-hidden">
                    {udruga.logo ? (
                      <img src={udruga.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (udruga.naziv || '?').charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition duration-300">
                      {udruga.naziv || 'Nepoznata udruga'}
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {udruga.kategorija || 'Općenito'}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4 leading-relaxed">
                  {(udruga.opis || '').length > 120 ? (udruga.opis || '').substring(0, 120) + '...' : (udruga.opis || '')}
                </p>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center text-gray-500">
                    <span className="mr-2">📧</span>
                    <span>{udruga.kontakt || '—'}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <span className="mr-2">📍</span>
                    <span>{udruga.adresa || 'Zagreb, Hrvatska'}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <span className="mr-2">👥</span>
                    <span>{udruga.brojClanova || 15} članova</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Osnovana {new Date(udruga.osnovana || '2020-01-01').getFullYear()}
                  </span>
                  {udruga.website && (
                    <a
                      href={udruga.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Posjeti web →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA dno */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Spreman/na si početi?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Pridruži se tisućama volontera koji već mijenjaju svijet. Tvoj doprinos može napraviti ogromnu razliku!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transform hover:scale-105 transition duration-300 shadow-lg"
            >
              🚀 Registriraj se BESPLATNO
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-blue-600 transform hover:scale-105 transition duration-300"
            >
              🔑 Već imam račun
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Homepage;
