#!/bin/bash
echo "Warte auf FHIR-Server..."
until $(curl --output /dev/null --silent --head --fail http://localhost:8080/fhir/metadata); do
    printf '.'
    sleep 2
done
echo "Server ist bereit! Lade Patienten hoch..."
curl -X PUT -H "Content-Type: application/fhir+json" -d @patient_mueller.json http://localhost:8080/fhir/Patient/mueller-ex
curl -X PUT -H "Content-Type: application/fhir+json" -d @patient_schmidt.json http://localhost:8080/fhir/Patient/schmidt-ex
curl -X PUT -H "Content-Type: application/fhir+json" -d @patient_bauer.json http://localhost:8080/fhir/Patient/bauer-ex
curl -X PUT -H "Content-Type: application/fhir+json" -d @sus_questionnaire.json http://localhost:8080/fhir/Questionnaire/german-sus-form
echo "Fertig!"
