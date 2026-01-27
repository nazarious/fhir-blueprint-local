import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactJson from 'react-json-view';
import './App.css';

const FHIR_SERVER = "http://localhost:8080/fhir";

function App() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [answers, setAnswers] = useState({}); 
  const [jsonLog, setJsonLog] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Patienten beim Start laden
useEffect(() => {
  let interval;

  const loadPatients = () => {
    axios.get(`${FHIR_SERVER}/Patient`)
      .then(res => {
        const patientData = res.data.entry || [];
        if (patientData.length > 0) {
          setPatients(patientData);
          // Sobald Patienten da sind, stoppen wir das automatische Abfragen
          clearInterval(interval);
        }
      })
      .catch(err => {
        console.log("Warte auf FHIR-Server und Daten...");
      });
  };

  // Sofort einmal prüfen
  loadPatients();

  // Danach alle 3 Sekunden prüfen, bis Patienten geladen sind
  interval = setInterval(loadPatients, 3000);

  // Aufräumen, falls die Komponente geschlossen wird
  return () => clearInterval(interval);
}, []);

  // Funktion zum Erstellen des QuestionnaireResponse-JSONs
  const createResponseResource = (currentAnswers, isFinal = false) => {
    const answeredItems = questionnaire?.item
      .map(q => {
        if (currentAnswers[q.linkId] !== undefined) {
          return {
            linkId: q.linkId,
            text: q.text,
            answer: [{ valueInteger: currentAnswers[q.linkId] }]
          };
        }
        return null;
      })
      .filter(item => item !== null) || [];

    return {
      resourceType: "QuestionnaireResponse",
      status: isFinal ? "completed" : "in-progress",
      questionnaire: "Questionnaire/german-sus-form",
      subject: { reference: `Patient/${selectedPatient?.id}` },
      authored: new Date().toISOString(),
      item: answeredItems
    };
  };

  const selectPatient = async (p) => {
    setSelectedPatient(p.resource);
    try {
      const res = await axios.get(`${FHIR_SERVER}/Questionnaire/german-sus-form`);
      setQuestionnaire(res.data);
      setAnswers({}); // Startet leer
      setJsonLog(res.data); // Zeigt zuerst das Questionnaire-Schema
    } catch (err) { console.error(err); }
  };

  const handleSliderChange = (linkId, value) => {
    const newAnswers = { ...answers, [linkId]: parseInt(value) };
    setAnswers(newAnswers);
    setJsonLog(createResponseResource(newAnswers)); // Live-Update des JSON Logs
  };

const calculateSUS = (currentAnswers) => {
  const keys = Object.keys(currentAnswers);
  // Wir brauchen alle 10 Antworten für einen validen Score
  if (keys.length < 10) return null;

  let totalScore = 0;
  questionnaire.item.forEach((item, index) => {
    const response = currentAnswers[item.linkId];
    const questionNumber = index + 1;

    if (questionNumber % 2 !== 0) {
      // Ungerade Fragen (1, 3, 5...): Positiv formuliert
      totalScore += (response - 1);
    } else {
      // Gerade Fragen (2, 4, 6...): Negativ formuliert
      totalScore += (5 - response);
    }
  });

  return totalScore * 2.5;
};


  const submitForm = async (e) => {
    e.preventDefault();
    const finalResource = createResponseResource(answers, true);
    try {
      await axios.post(`${FHIR_SERVER}/QuestionnaireResponse`, finalResource);
      setJsonLog(finalResource);
      setSubmitted(true);
    } catch (err) { alert("Fehler beim Senden"); }
  };

  // ANSICHT 1: Dashboard
if (!selectedPatient) {
  return (
    <div className="dashboard">
      <h1>🩺 Beispielkliniken KIS</h1>
      {patients.length === 0 ? (
        <div style={{ marginTop: '50px' }}>
          <div className="spinner"></div>
          <p>Verbindung zum FHIR-Server wird aufgebaut...</p>
        </div>
      ) : (
        <div className="patient-grid">
          {patients.map(p => (
            <div key={p.resource.id} className="patient-card" onClick={() => selectPatient(p)}>
              <span className="patient-icon">{p.resource.gender === 'male' ? '👨🏻' : '👩🏼'}</span>
              <h3>{p.resource.name[0].family}, {p.resource.name[0].given[0]}</h3>
              <p><strong>Geboren:</strong> {new Date(p.resource.birthDate).toLocaleDateString('de-DE')}</p>
              <p className="open-record">→ Fragebogen senden</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

  return (
    <div className="split-screen">
      <div className="left-panel">
        <div className="patient-header">
          <h3>Patient: {selectedPatient.name[0].family}, {selectedPatient.name[0].given[0]}</h3>
          <p>Geburtstag: {new Date(selectedPatient.birthDate).toLocaleDateString('de-DE')} | ID: {selectedPatient.id}</p>
        </div>
        <hr />
        {!submitted ? (
          <form onSubmit={submitForm}>
            <h2>{questionnaire?.title}</h2>
            {questionnaire?.item.map(item => (
              <div key={item.linkId} className="form-item">
                <label>
                  {item.text} 
                  <span className="val-badge">
                    {answers[item.linkId] !== undefined ? `Wert: ${answers[item.linkId]}` : "bitte wählen"}
                  </span>
                </label>
                <input 
                  type="range" min="1" max="5" step="1"
                  value={answers[item.linkId] || 3} 
                  onChange={(e) => handleSliderChange(item.linkId, e.target.value)} 
                />
              </div>
            ))}
            <button type="submit" className="submit-btn" disabled={Object.keys(answers).length < 10}>
              Formular final versenden
            </button>
          </form>
        ) : (
          <div className="success-msg" style={{textAlign: 'center'}}>
            <h2>✅ Ergebnis gespeichert!</h2>
            <div className="score-circle">
              <h1>{calculateSUS(answers)}</h1>
              <p>SUS Score</p>
            </div>
            <p>{calculateSUS(answers) >= 68 ? "👍 Gute Usability" : "⚠️ Optimierung empfohlen"}</p>
            <button className="reset-btn" onClick={() => window.location.reload()}>
              Zurück zu Dashboard
            </button>
          </div>
        )}
      </div>
      <div className="right-panel">
        <h3>FHIR JSON Live-Log</h3>
        <ReactJson src={jsonLog} theme="monokai" displayDataTypes={false} collapsed={false} />
      </div>
    </div>
  );
}

export default App;
