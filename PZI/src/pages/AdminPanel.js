import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('eventi');
  const [eventi, setEventi] = useState([]);
  const [udruge, setUdruge] = useState([]);
  const [korisnici, setKorisnici] = useState([]);

  // Event forma
  const [eventForm, setEventForm] = useState({
    naziv: '', opis: '', datum: '', lokacija: '', maxVolonteri: ''
  });
  
  // Udruga forma
  const [udrugaForm, setUdrugaForm] = useState({
    naziv: '', opis: '', kontakt: ''
  });

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchEventi();
    fetchUdruge();
    fetchKorisnici();
  }, []);

  // Dohvati evente
  const fetchEventi = async () => {
    const snapshot = await getDocs(collection(db, 'eventi'));
    const eventiData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setEventi(eventiData);
  };

  // Dohvati udruge
  const fetchUdruge = async () => {
    const snapshot = await getDocs(collection(db, 'udruge'));
    const udrugeData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setUdruge(udrugeData);
  };

  // Dohvati korisnike
  const fetchKorisnici = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const korisniciData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setKorisnici(korisniciData);
  };

  // CRUD za evente
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        ...eventForm,
        status: 'aktivan',
        maxVolonteri: parseInt(eventForm.maxVolonteri),
        volonteri: []
      };

      if (editingId) {
        await updateDoc(doc(db, 'eventi', editingId), eventData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'eventi'), eventData);
      }

      setEventForm({ naziv: '', opis: '', datum: '', lokacija: '', maxVolonteri: '' });
      fetchEventi();
    } catch (error) {
      console.error('Greška:', error);
    }
  };

  const editEvent = (event) => {
    setEventForm({
      naziv: event.naziv,
      opis: event.opis,
      datum: event.datum,
      lokacija: event.lokacija,
      maxVolonteri: event.maxVolonteri.toString()
    });
    setEditingId(event.id);
  };

  const deleteEvent = async (id) => {
    if (window.confirm('Sigurno želiš obrisati event?')) {
      await deleteDoc(doc(db, 'eventi', id));
      fetchEventi();
    }
  };

  // CRUD za udruge
  const handleUdrugaSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'udruge', editingId), udrugaForm);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'udruge'), udrugaForm);
      }

      setUdrugaForm({ naziv: '', opis: '', kontakt: '' });
      fetchUdruge();
    } catch (error) {
      console.error('Greška:', error);
    }
  };

  const editUdruga = (udruga) => {
    setUdrugaForm({
      naziv: udruga.naziv,
      opis: udruga.opis,
      kontakt: udruga.kontakt
    });
    setEditingId(udruga.id);
  };

  const deleteUdruga = async (id) => {
    if (window.confirm('Sigurno želiš obrisati udrugu?')) {
      await deleteDoc(doc(db, 'udruge', id));
      fetchUdruge();
    }
  };

  const promijeniUloguKorisnika = async (korisnikId, novaUloga) => {
    try {
      await updateDoc(doc(db, 'users', korisnikId), {
        role: novaUloga
      });
      fetchKorisnici();
    } catch (error) {
      console.error('Greška:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Panel</h1>

      {/* Tab navigacija */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('eventi')}
          className={`px-4 py-2 rounded ${
            activeTab === 'eventi' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Eventi
        </button>
        <button
          onClick={() => setActiveTab('udruge')}
          className={`px-4 py-2 rounded ${
            activeTab === 'udruge' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Udruge
        </button>
        <button
          onClick={() => setActiveTab('korisnici')}
          className={`px-4 py-2 rounded ${
            activeTab === 'korisnici' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Korisnici
        </button>
      </div>

      {/* Tab sadržaj - Eventi */}
      {activeTab === 'eventi' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Upravljanje eventima</h2>
          
          {/* Forma za dodavanje/uređivanje */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'Uredi event' : 'Dodaj novi event'}
            </h3>
            <form onSubmit={handleEventSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Naziv eventa"
                value={eventForm.naziv}
                onChange={(e) => setEventForm({...eventForm, naziv: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              <textarea
                placeholder="Opis eventa"
                value={eventForm.opis}
                onChange={(e) => setEventForm({...eventForm, opis: e.target.value})}
                className="w-full p-2 border rounded"
                rows="3"
                required
              />
              <input
                type="date"
                value={eventForm.datum}
                onChange={(e) => setEventForm({...eventForm, datum: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Lokacija"
                value={eventForm.lokacija}
                onChange={(e) => setEventForm({...eventForm, lokacija: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="number"
                placeholder="Maksimalan broj volontera"
                value={eventForm.maxVolonteri}
                onChange={(e) => setEventForm({...eventForm, maxVolonteri: e.target.value})}
                className="w-full p-2 border rounded"
                min="1"
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {editingId ? 'Spremi promjene' : 'Dodaj event'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setEventForm({ naziv: '', opis: '', datum: '', lokacija: '', maxVolonteri: '' });
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Odustani
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Lista evenata */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventi.map(event => (
              <div key={event.id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-2">{event.naziv}</h3>
                <p className="text-gray-600 mb-4">{event.opis}</p>
                <div className="text-sm text-gray-500 mb-4">
                  <p>Datum: {event.datum}</p>
                  <p>Lokacija: {event.lokacija}</p>
                  <p>Volontera: {event.volonteri?.length || 0}/{event.maxVolonteri}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => editEvent(event)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                  >
                    Uredi
                  </button>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Obriši
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab sadržaj - Udruge */}
      {activeTab === 'udruge' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Upravljanje udrugama</h2>
          
          {/* Forma za dodavanje/uređivanje */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'Uredi udrugu' : 'Dodaj novu udrugu'}
            </h3>
            <form onSubmit={handleUdrugaSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Naziv udruge"
                value={udrugaForm.naziv}
                onChange={(e) => setUdrugaForm({...udrugaForm, naziv: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              <textarea
                placeholder="Opis udruge"
                value={udrugaForm.opis}
                onChange={(e) => setUdrugaForm({...udrugaForm, opis: e.target.value})}
                className="w-full p-2 border rounded"
                rows="3"
                required
              />
              <input
                type="text"
                placeholder="Kontakt (email ili telefon)"
                value={udrugaForm.kontakt}
                onChange={(e) => setUdrugaForm({...udrugaForm, kontakt: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  {editingId ? 'Spremi promjene' : 'Dodaj udrugu'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setUdrugaForm({ naziv: '', opis: '', kontakt: '' });
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Odustani
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Lista udruga */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {udruge.map(udruga => (
              <div key={udruga.id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-2">{udruga.naziv}</h3>
                <p className="text-gray-600 mb-4">{udruga.opis}</p>
                <p className="text-sm text-gray-500 mb-4">
                  Kontakt: {udruga.kontakt}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => editUdruga(udruga)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                  >
                    Uredi
                  </button>
                  <button
                    onClick={() => deleteUdruga(udruga.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Obriši
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab sadržaj - Korisnici */}
      {activeTab === 'korisnici' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Upravljanje korisnicima</h2>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ime
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Prezime
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Uloga
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {korisnici.map(korisnik => (
                  <tr key={korisnik.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {korisnik.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {korisnik.ime}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {korisnik.prezime}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        korisnik.role === 'admin' 
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {korisnik.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={korisnik.role}
                        onChange={(e) => promijeniUloguKorisnika(korisnik.id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="korisnik">Korisnik</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;