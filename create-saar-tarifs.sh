#!/bin/bash

# Script pour créer tous les tarifs SAAR NANSOU
# Assurez-vous d'avoir un token admin valide

API_BASE="http://localhost:3000"
GRILLE_ID="3ee3c448-98b5-4b5f-be9a-f25fddf3f72e"
TOKEN="YOUR_ADMIN_TOKEN_HERE"

echo "🎯 Création des tarifs SAAR NANSOU..."
echo "Grille ID: $GRILLE_ID"
echo ""

# Fonction pour créer un tarif
create_tarif() {
    local capital=$1
    local age=$2
    local duree=$3
    local montant=$4
    local description=$5
    
    echo "📋 Création: $description"
    echo "   Capital: $capital FCFA, Age: $age ans, Durée: $duree ans, Prime: $montant FCFA"
    
    curl -X POST "$API_BASE/admin/tarifs" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{
            \"grille_id\": \"$GRILLE_ID\",
            \"montant_fixe\": $montant,
            \"criteres_combines\": {
                \"Capital\": \"$capital\",
                \"Age Assuré\": \"$age\",
                \"Durée de cotisation\": \"$duree\"
            }
        }" \
        -w "\n   Status: %{http_code}\n\n"
}

echo "1️⃣ POUR ASCENDANT - ÂGE 75 ANS - COTISATIONS 2 ANS"
echo "=================================================="
create_tarif "500000" "75" "2" "21138" "Capital 500K - Age 75 - Durée 2 ans"
create_tarif "750000" "75" "2" "31457" "Capital 750K - Age 75 - Durée 2 ans"
create_tarif "1000000" "75" "2" "41776" "Capital 1M - Age 75 - Durée 2 ans"
create_tarif "1500000" "75" "2" "62415" "Capital 1.5M - Age 75 - Durée 2 ans"
create_tarif "2000000" "75" "2" "83053" "Capital 2M - Age 75 - Durée 2 ans"

echo "2️⃣ POUR ASCENDANT - ÂGE 72 ANS - COTISATIONS 5 ANS"
echo "=================================================="
create_tarif "500000" "72" "5" "9698" "Capital 500K - Age 72 - Durée 5 ans"
create_tarif "750000" "72" "5" "14296" "Capital 750K - Age 72 - Durée 5 ans"
create_tarif "1000000" "72" "5" "18895" "Capital 1M - Age 72 - Durée 5 ans"
create_tarif "1500000" "72" "5" "28093" "Capital 1.5M - Age 72 - Durée 5 ans"
create_tarif "2000000" "72" "5" "37290" "Capital 2M - Age 72 - Durée 5 ans"

echo "3️⃣ POUR ASCENDANT - ÂGE 69 ANS - COTISATIONS 5 ANS"
echo "=================================================="
create_tarif "500000" "69" "5" "9233" "Capital 500K - Age 69 - Durée 5 ans"
create_tarif "750000" "69" "5" "13599" "Capital 750K - Age 69 - Durée 5 ans"
create_tarif "1000000" "69" "5" "17966" "Capital 1M - Age 69 - Durée 5 ans"
create_tarif "1500000" "69" "5" "26699" "Capital 1.5M - Age 69 - Durée 5 ans"
create_tarif "2000000" "69" "5" "35432" "Capital 2M - Age 69 - Durée 5 ans"

echo "4️⃣ FAMILLE - ÂGE 40 ANS - COTISATIONS 10 ANS"
echo "============================================="
create_tarif "500000" "40" "10" "3811" "Capital 500K - Age 40 - Durée 10 ans"
create_tarif "750000" "40" "10" "5466" "Capital 750K - Age 40 - Durée 10 ans"
create_tarif "1000000" "40" "10" "7122" "Capital 1M - Age 40 - Durée 10 ans"
create_tarif "1500000" "40" "10" "10433" "Capital 1.5M - Age 40 - Durée 10 ans"
create_tarif "2000000" "40" "10" "13744" "Capital 2M - Age 40 - Durée 10 ans"

echo "✅ Création de tous les tarifs SAAR NANSOU terminée !"
echo "📊 Total: 20 tarifs créés"
echo ""
echo "🧪 Test de simulation recommandé :"
echo "POST $API_BASE/simulation-devis-simplifie"
echo "{"
echo "  \"produit_id\": \"370ca1d2-de8b-4649-9171-5f6e874c9154\","
echo "  \"criteres_utilisateur\": {"
echo "    \"Capital\": \"1000000\","
echo "    \"Age Assuré\": \"72\","
echo "    \"Durée de cotisation\": \"5\""
echo "  }"
echo "}"
echo "Résultat attendu: Prime = 18895 FCFA"
