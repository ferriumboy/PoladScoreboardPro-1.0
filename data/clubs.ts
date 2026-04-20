
export interface ClubData {
  id: string;
  name: string;
  logo: string;
}

export const teamLogos: Record<string, string> = {
  // --- 🇦🇿 AZƏRBAYCAN (FOTMOB SERVERİ - 100% İŞLƏK) ---
  "Qarabağ FK": "https://qarabagh.com/templates/garabagh/assets/img/logo/garabagh-new-logo.png",
  "Neftçi PFK": "https://upload.wikimedia.org/wikipedia/en/9/92/Neft%C3%A7i_PFK_logo.png",
  "Sabah FK": "https://images.seeklogo.com/logo-png/55/1/sabah-fk-logo-png_seeklogo-552623.png",
  "Zirə FK": "https://images.seeklogo.com/logo-png/30/1/zira-fk-logo-png_seeklogo-306315.png",
  "Sumqayıt FK": "https://images.seeklogo.com/logo-png/35/1/fk-sumqayit-logo-png_seeklogo-357660.png",
  "Turan Tovuz": "https://images.seeklogo.com/logo-png/34/1/turan-tovuz-fk-logo-png_seeklogo-346534.png",
  "Səbail FK": "https://images.seeklogo.com/logo-png/34/1/fk-sbail-baku-logo-png_seeklogo-341026.png",
  "Kəpəz PFK": "https://upload.wikimedia.org/wikipedia/az/5/56/K%C9%99p%C9%99z_PFK_loqo.png",
  "Araz-Naxçıvan": "https://images.seeklogo.com/logo-png/49/1/pfk-araz-naxcivan-logo-png_seeklogo-493902.png",
  "Şamaxı FK": "https://images.seeklogo.com/logo-png/56/1/fk-samaxi-logo-png_seeklogo-560702.png",

  // --- 🏴󠁧󠁢󠁥󠁮󠁧󠁿 İNGİLTƏRƏ - Premier League ---
  "Arsenal": "https://en.wikipedia.org/wiki/Special:FilePath/Arsenal_FC.svg?width=512",
  "Aston Villa": "https://en.wikipedia.org/wiki/Special:FilePath/Aston_Villa_logo.svg?width=512",
  "Bournemouth": "https://en.wikipedia.org/wiki/Special:FilePath/AFC_Bournemouth_%282013%29.svg?width=512",
  "Brentford": "https://en.wikipedia.org/wiki/Special:FilePath/Brentford_FC_crest.svg?width=512",
  "Brighton & Hove Albion": "https://en.wikipedia.org/wiki/Special:FilePath/Brighton_%26_Hove_Albion_logo.svg?width=512",
  "Chelsea": "https://en.wikipedia.org/wiki/Special:FilePath/Chelsea_FC.svg?width=512",
  "Crystal Palace": "https://en.wikipedia.org/wiki/Special:FilePath/Crystal_Palace_FC_logo_%282022%29.svg?width=512",
  "Everton": "https://en.wikipedia.org/wiki/Special:FilePath/Everton_FC_logo.svg?width=512",
  "Fulham": "https://en.wikipedia.org/wiki/Special:FilePath/Fulham_FC_%28shield%29.svg?width=512",
  "Ipswich Town": "https://en.wikipedia.org/wiki/Special:FilePath/Ipswich_Town.svg?width=512",
  "Leicester City": "https://en.wikipedia.org/wiki/Special:FilePath/Leicester_City_crest.svg?width=512",
  "Liverpool": "https://en.wikipedia.org/wiki/Special:FilePath/Liverpool_FC.svg?width=512",
  "Manchester City": "https://en.wikipedia.org/wiki/Special:FilePath/Manchester_City_FC_badge.svg?width=512",
  "Manchester United": "https://en.wikipedia.org/wiki/Special:FilePath/Manchester_United_FC_crest.svg?width=512",
  "Newcastle United": "https://en.wikipedia.org/wiki/Special:FilePath/Newcastle_United_Logo.svg?width=512",
  "Nottingham Forest": "https://en.wikipedia.org/wiki/Special:FilePath/Nottingham_Forest_F.C._logo.svg?width=512",
  "Southampton": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Southampton.svg?width=512",
  "Tottenham Hotspur": "https://en.wikipedia.org/wiki/Special:FilePath/Tottenham_Hotspur.svg?width=512",
  "West Ham United": "https://en.wikipedia.org/wiki/Special:FilePath/West_Ham_United_FC_logo.svg?width=512",
  "Wolverhampton Wanderers": "https://en.wikipedia.org/wiki/Special:FilePath/Wolverhampton_Wanderers.svg?width=512",

  // --- 🏴󠁧󠁢󠁥󠁮󠁧󠁿 İNGİLTƏRƏ - Championship (2-ci Liqa) ---
  "Leeds United": "https://en.wikipedia.org/wiki/Special:FilePath/Leeds_United_F.C._logo.svg?width=512",
  "Burnley": "https://en.wikipedia.org/wiki/Special:FilePath/Burnley_F.C._Logo.svg?width=512",
  "Luton Town": "https://en.wikipedia.org/wiki/Special:FilePath/Luton_Town_logo.svg?width=512",
  "Sheffield United": "https://en.wikipedia.org/wiki/Special:FilePath/Sheffield_United_FC_logo.svg?width=512",
  "West Bromwich Albion": "https://en.wikipedia.org/wiki/Special:FilePath/West_Bromwich_Albion.svg?width=512",
  "Norwich City": "https://en.wikipedia.org/wiki/Special:FilePath/Norwich_City.svg?width=512",
  "Hull City": "https://en.wikipedia.org/wiki/Special:FilePath/Hull_City_A.F.C._logo.svg?width=512",
  "Middlesbrough": "https://en.wikipedia.org/wiki/Special:FilePath/Middlesbrough_FC_crest.svg?width=512",
  "Sunderland": "https://en.wikipedia.org/wiki/Special:FilePath/Logo_Sunderland.svg?width=512",
  "Watford": "https://en.wikipedia.org/wiki/Special:FilePath/Watford.svg?width=512",
  "Stoke City": "https://en.wikipedia.org/wiki/Special:FilePath/Stoke_City_FC.svg?width=512",
  "Queens Park Rangers": "https://en.wikipedia.org/wiki/Special:FilePath/Queens_Park_Rangers_crest.svg?width=512",
  "Blackburn Rovers": "https://en.wikipedia.org/wiki/Special:FilePath/Blackburn_Rovers.svg?width=512",
  "Sheffield Wednesday": "https://en.wikipedia.org/wiki/Special:FilePath/Sheffield_Wednesday_badge.svg?width=512",
  "Swansea City": "https://en.wikipedia.org/wiki/Special:FilePath/Swansea_City_AFC_logo.svg?width=512",
  "Cardiff City": "https://en.wikipedia.org/wiki/Special:FilePath/Cardiff_City_FC_logo.svg?width=512",
  "Millwall": "https://en.wikipedia.org/wiki/Special:FilePath/Millwall_F.C._logo.svg?width=512",
  "Derby County": "https://en.wikipedia.org/wiki/Special:FilePath/Derby_County_crest.svg?width=512",
  "Portsmouth": "https://en.wikipedia.org/wiki/Special:FilePath/Portsmouth_FC_logo.svg?width=512",
  "Bristol City": "https://en.wikipedia.org/wiki/Special:FilePath/Bristol_City_logo.svg?width=512",
  "Coventry City": "https://en.wikipedia.org/wiki/Special:FilePath/Coventry_City_FC_logo.svg?width=512",
  "Oxford United": "https://en.wikipedia.org/wiki/Special:FilePath/Oxford_United_FC_logo.svg?width=512",
  "Plymouth Argyle": "https://en.wikipedia.org/wiki/Special:FilePath/Plymouth_Argyle_F.C._logo.svg?width=512",
  "Preston North End": "https://en.wikipedia.org/wiki/Special:FilePath/Preston_North_End_FC.svg?width=512",

  // --- 🇪🇸 İSPANİYA - La Liga ---
  "Athletic Bilbao": "https://en.wikipedia.org/wiki/Special:FilePath/Club_Athletic_Bilbao_logo.svg?width=512",
  "Atlético Madrid": "https://en.wikipedia.org/wiki/Special:FilePath/Atletico_Madrid_2017_logo.svg?width=512",
  "Barcelona": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Barcelona_%28crest%29.svg?width=512",
  "Celta Vigo": "https://en.wikipedia.org/wiki/Special:FilePath/RC_Celta_de_Vigo_logo.svg?width=512",
  "Deportivo Alavés": "https://en.wikipedia.org/wiki/Special:FilePath/Deportivo_Alaves_logo.svg?width=512",
  "Espanyol": "https://en.wikipedia.org/wiki/Special:FilePath/Rcd_espanyol_logo.svg?width=512",
  "Getafe": "https://en.wikipedia.org/wiki/Special:FilePath/Getafe_logo.svg?width=512",
  "Girona": "https://en.wikipedia.org/wiki/Special:FilePath/For_Girona_FC.svg?width=512",
  "Las Palmas": "https://en.wikipedia.org/wiki/Special:FilePath/UD_Las_Palmas_logo.svg?width=512",
  "Leganés": "https://en.wikipedia.org/wiki/Special:FilePath/Club_Deportivo_Legan%C3%A9s_logo.svg?width=512",
  "Mallorca": "https://en.wikipedia.org/wiki/Special:FilePath/RCD_Mallorca_logo.svg?width=512",
  "Osasuna": "https://en.wikipedia.org/wiki/Special:FilePath/Osasuna_logo.svg?width=512",
  "Rayo Vallecano": "https://commons.wikimedia.org/wiki/Special:FilePath/Rayo_Vallecano_de_Madrid.svg?width=512",
  "Real Betis": "https://en.wikipedia.org/wiki/Special:FilePath/Real_betis_logo.svg?width=512",
  "Real Madrid": "https://en.wikipedia.org/wiki/Special:FilePath/Real_Madrid_CF.svg?width=512",
  "Real Sociedad": "https://en.wikipedia.org/wiki/Special:FilePath/Real_Sociedad_logo.svg?width=512",
  "Real Valladolid": "https://en.wikipedia.org/wiki/Special:FilePath/Real_Valladolid_Logo.svg?width=512",
  "Sevilla": "https://en.wikipedia.org/wiki/Special:FilePath/Sevilla_FC_logo.svg?width=512",
  "Valencia": "https://en.wikipedia.org/wiki/Special:FilePath/Valenciacf.svg?width=512",
  "Villarreal": "https://en.wikipedia.org/wiki/Special:FilePath/Villarreal_CF_logo.svg?width=512",

  // --- 🇪🇸 İSPANİYA - Segunda (2-ci Liqa) ---
  "Almería": "https://en.wikipedia.org/wiki/Special:FilePath/UD_Almer%C3%ADa_logo.svg?width=512",
  "Cádiz": "https://en.wikipedia.org/wiki/Special:FilePath/C%C3%A1diz_CF_logo.svg?width=512",
  "Granada": "https://en.wikipedia.org/wiki/Special:FilePath/Logo_of_Granada_CF.svg?width=512",
  "Deportivo La Coruña": "https://en.wikipedia.org/wiki/Special:FilePath/Real_Club_Deportivo_de_La_Coru%C3%B1a_logo.svg?width=512",
  "Málaga": "https://en.wikipedia.org/wiki/Special:FilePath/M%C3%A1laga_CF.svg?width=512",
  "Real Oviedo": "https://en.wikipedia.org/wiki/Special:FilePath/Real_Oviedo_logo.svg?width=512",
  "Oviedo": "https://en.wikipedia.org/wiki/Special:FilePath/Real_Oviedo_logo.svg?width=512",
  "Racing Santander": "https://en.wikipedia.org/wiki/Special:FilePath/Real_Racing_Club_de_Santander_Logo.svg?width=512",
  "Sporting Gijón": "https://en.wikipedia.org/wiki/Special:FilePath/Real_Sporting_de_Gij%C3%B3n_logo.svg?width=512",
  "Eibar": "https://en.wikipedia.org/wiki/Special:FilePath/SD_Eibar_logo_2016.svg?width=512",
  "Levante": "https://en.wikipedia.org/wiki/Special:FilePath/Levante_Uni%C3%B3n_Deportiva%2C_S.A.D._logo.svg?width=512",
  "Elche": "https://en.wikipedia.org/wiki/Special:FilePath/Elche_CF_logo.svg?width=512",
  "Tenerife": "https://en.wikipedia.org/wiki/Special:FilePath/CD_Tenerife_logo.svg?width=512",
  "Real Zaragoza": "https://en.wikipedia.org/wiki/Special:FilePath/Real_Zaragoza_logo.svg?width=512",
  "Zaragoza": "https://en.wikipedia.org/wiki/Special:FilePath/Real_Zaragoza_logo.svg?width=512",
  "Albacete": "https://en.wikipedia.org/wiki/Special:FilePath/Albacete_Balompi%C3%A9_logo.svg?width=512",
  "Burgos": "https://en.wikipedia.org/wiki/Special:FilePath/Burgos_CF_Logo.svg?width=512",
  "Cartagena": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Cartagena_logo.svg?width=512",
  "Castellón": "https://en.wikipedia.org/wiki/Special:FilePath/CD_Castell%C3%B3n.svg?width=512",
  "Córdoba": "https://en.wikipedia.org/wiki/Special:FilePath/C%C3%B3rdoba_CF_logo.svg?width=512",
  "Eldense": "https://en.wikipedia.org/wiki/Special:FilePath/CD_Eldense.svg?width=512",
  "Ferrol": "https://en.wikipedia.org/wiki/Special:FilePath/Racing_Ferrol_logo.svg?width=512",
  "Huesca": "https://en.wikipedia.org/wiki/Special:FilePath/SD_Huesca_2022_logo.svg?width=512",
  "Mirandés": "https://en.wikipedia.org/wiki/Special:FilePath/CD_Mirand%C3%A9s_logo.svg?width=512",

  // --- 🇩🇪 ALMANİYA - Bundesliga ---
  "Augsburg": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Augsburg_logo.svg?width=512",
  "Bayer Leverkusen": "https://en.wikipedia.org/wiki/Special:FilePath/Bayer_04_Leverkusen_logo.svg?width=512",
  "Bayern Munich": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg?width=512",
  "Bochum": "https://en.wikipedia.org/wiki/Special:FilePath/VfL_Bochum_logo.svg?width=512",
  "Borussia Dortmund": "https://en.wikipedia.org/wiki/Special:FilePath/Borussia_Dortmund_logo.svg?width=512",
  "Borussia Mönchengladbach": "https://en.wikipedia.org/wiki/Special:FilePath/Borussia_M%C3%B6nchengladbach_logo.svg?width=512",
  "Eintracht Frankfurt": "https://en.wikipedia.org/wiki/Special:FilePath/Eintracht_Frankfurt_Logo.svg?width=512",
  "Freiburg": "https://en.wikipedia.org/wiki/Special:FilePath/SC_Freiburg_logo.svg?width=512",
  "Heidenheim": "https://en.wikipedia.org/wiki/Special:FilePath/1._FC_Heidenheim_1846.svg?width=512",
  "Hoffenheim": "https://en.wikipedia.org/wiki/Special:FilePath/Logo_TSG_Hoffenheim.svg?width=512",
  "Holstein Kiel": "https://en.wikipedia.org/wiki/Special:FilePath/Holstein_Kiel_Logo.svg?width=512",
  "Mainz 05": "https://en.wikipedia.org/wiki/Special:FilePath/FSV_Mainz_05_Logo.svg?width=512",
  "RB Leipzig": "https://en.wikipedia.org/wiki/Special:FilePath/RB_Leipzig_2014_logo.svg?width=512",
  "St. Pauli": "https://en.wikipedia.org/wiki/Special:FilePath/FC_St._Pauli_logo.svg?width=512",
  "Stuttgart": "https://en.wikipedia.org/wiki/Special:FilePath/VfB_Stuttgart_1893_Logo.svg?width=512",
  "Union Berlin": "https://en.wikipedia.org/wiki/Special:FilePath/1._FC_Union_Berlin_Logo.svg?width=512",
  "Werder Bremen": "https://en.wikipedia.org/wiki/Special:FilePath/SV-Werder-Bremen-Logo.svg?width=512",
  "Wolfsburg": "https://en.wikipedia.org/wiki/Special:FilePath/Logo-VfL-Wolfsburg.svg?width=512",

  // --- 🇩🇪 ALMANİYA - 2. Bundesliga ---
  "Köln": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Cologne_logo.svg?width=512",
  "Darmstadt 98": "https://en.wikipedia.org/wiki/Special:FilePath/SV_Darmstadt_98_Logo.svg?width=512",
  "Fortuna Düsseldorf": "https://en.wikipedia.org/wiki/Special:FilePath/Fortuna_D%C3%BCsseldorf.svg?width=512",
  "Hamburger SV": "https://en.wikipedia.org/wiki/Special:FilePath/HSV-Logo.svg?width=512",
  "Hannover 96": "https://en.wikipedia.org/wiki/Special:FilePath/Hannover_96_Logo.svg?width=512",
  "Hertha BSC": "https://en.wikipedia.org/wiki/Special:FilePath/Hertha_BSC_Logo_2012.svg?width=512",
  "Schalke 04": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Schalke_04_Logo.svg?width=512",
  "Nürnberg": "https://en.wikipedia.org/wiki/Special:FilePath/1._FC_N%C3%BCrnberg_logo.svg?width=512",
  "Kaiserslautern": "https://en.wikipedia.org/wiki/Special:FilePath/1._FC_Kaiserslautern.svg?width=512",
  "Magdeburg": "https://en.wikipedia.org/wiki/Special:FilePath/1._FC_Magdeburg.svg?width=512",
  "Karlsruher SC": "https://en.wikipedia.org/wiki/Special:FilePath/Karlsruher_SC_logo.svg?width=512",
  "Eintracht Braunschweig": "https://en.wikipedia.org/wiki/Special:FilePath/Eintracht_Braunschweig_Logo.svg?width=512",
  "Elversberg": "https://en.wikipedia.org/wiki/Special:FilePath/SV_07_Elversberg_Logo.svg?width=512",
  "Greuther Fürth": "https://en.wikipedia.org/wiki/Special:FilePath/SpVgg_Greuther_F%C3%BCrth_logo_%282017%29.svg?width=512",
  "Jahn Regensburg": "https://en.wikipedia.org/wiki/Special:FilePath/SSV_Jahn_Regensburg_logo.svg?width=512",
  "Münster": "https://en.wikipedia.org/wiki/Special:FilePath/Preu%C3%9Fen_M%C3%BCnster_logo.svg?width=512",
  "Paderborn": "https://en.wikipedia.org/wiki/Special:FilePath/SC_Paderborn_07_logo.svg?width=512",
  "Ulm": "https://en.wikipedia.org/wiki/Special:FilePath/SSV_Ulm_1846_Fussball_Logo.svg?width=512",

  // --- 🇮🇹 İTALİYA - Serie A ---
  "AC Milan": "https://en.wikipedia.org/wiki/Special:FilePath/Logo_of_AC_Milan.svg?width=512",
  "Atalanta": "https://en.wikipedia.org/wiki/Special:FilePath/AtalantaBC.svg?width=512",
  "Bologna": "https://en.wikipedia.org/wiki/Special:FilePath/Bologna_F.C._1909_logo.svg?width=512",
  "Cagliari": "https://en.wikipedia.org/wiki/Special:FilePath/Cagliari_Calcio_1920.svg?width=512",
  "Como": "https://en.wikipedia.org/wiki/Special:FilePath/Como_1907_logo.svg?width=512",
  "Empoli": "https://en.wikipedia.org/wiki/Special:FilePath/Empoli_FC_1920.svg?width=512",
  "Fiorentina": "https://en.wikipedia.org/wiki/Special:FilePath/ACF_Fiorentina_2.svg?width=512",
  "Genoa": "https://en.wikipedia.org/wiki/Special:FilePath/Genoa_C.F.C._logo.svg?width=512",
  "Hellas Verona": "https://en.wikipedia.org/wiki/Special:FilePath/Hellas_Verona_FC_logo_%282020%29.svg?width=512",
  "Inter Milan": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Internazionale_Milano_2021.svg?width=512",
  "Juventus": "https://en.wikipedia.org/wiki/Special:FilePath/Juventus_FC_2017_icon_%28black%29.svg?width=512",
  "Lazio": "https://en.wikipedia.org/wiki/Special:FilePath/S.S._Lazio_badge.svg?width=512",
  "Lecce": "https://en.wikipedia.org/wiki/Special:FilePath/U.S._Lecce.svg?width=512",
  "Monza": "https://en.wikipedia.org/wiki/Special:FilePath/AC_Monza_logo.svg?width=512",
  "Napoli": "https://en.wikipedia.org/wiki/Special:FilePath/SSC_Napoli_logo.svg?width=512",
  "Parma": "https://en.wikipedia.org/wiki/Special:FilePath/Parma_Calcio_1913_logo.svg?width=512",
  "Roma": "https://en.wikipedia.org/wiki/Special:FilePath/AS_Roma_logo_%282017%29.svg?width=512",
  "Torino": "https://en.wikipedia.org/wiki/Special:FilePath/Torino_FC_Logo.svg?width=512",
  "Udinese": "https://en.wikipedia.org/wiki/Special:FilePath/Udinese_Calcio_logo.svg?width=512",
  "Venezia": "https://en.wikipedia.org/wiki/Special:FilePath/Venezia_FC_logo.svg?width=512",

  // --- 🇮🇹 İTALİYA - Serie B ---
  "Sassuolo": "https://en.wikipedia.org/wiki/Special:FilePath/US_Sassuolo_Calcio_logo.svg?width=512",
  "Salernitana": "https://en.wikipedia.org/wiki/Special:FilePath/U.S._Salernitana_1919_logo.svg?width=512",
  "Frosinone": "https://en.wikipedia.org/wiki/Special:FilePath/Frosinone_Calcio_logo.svg?width=512",
  "Sampdoria": "https://en.wikipedia.org/wiki/Special:FilePath/U.C._Sampdoria_logo.svg?width=512",
  "Cremonese": "https://en.wikipedia.org/wiki/Special:FilePath/U.S._Cremonese_logo.svg?width=512",
  "Palermo": "https://en.wikipedia.org/wiki/Special:FilePath/Palermo_F.C._logo.svg?width=512",
  "Bari": "https://en.wikipedia.org/wiki/Special:FilePath/SSC_Bari_logo.svg?width=512",
  "Brescia": "https://en.wikipedia.org/wiki/Special:FilePath/Brescia_Calcio_badge.svg?width=512",
  "Pisa": "https://en.wikipedia.org/wiki/Special:FilePath/Pisa_Sporting_Club_logo.svg?width=512",
  "Spezia": "https://en.wikipedia.org/wiki/Special:FilePath/Spezia_Calcio_Logo.svg?width=512",
  "Catanzaro": "https://en.wikipedia.org/wiki/Special:FilePath/US_Catanzaro_1929_logo.svg?width=512",
  "Cesena": "https://en.wikipedia.org/wiki/Special:FilePath/Cesena_FC_logo.svg?width=512",
  "Cittadella": "https://en.wikipedia.org/wiki/Special:FilePath/A.S._Cittadella_1973.svg?width=512",
  "Cosenza": "https://en.wikipedia.org/wiki/Special:FilePath/Cosenza_Calcio_logo.svg?width=512",
  "Juve Stabia": "https://en.wikipedia.org/wiki/Special:FilePath/SS_Juve_Stabia_logo.svg?width=512",
  "Mantova": "https://en.wikipedia.org/wiki/Special:FilePath/Mantova_1911_logo.svg?width=512",
  "Modena": "https://en.wikipedia.org/wiki/Special:FilePath/Modena_FC_2018_logo.svg?width=512",
  "Reggiana": "https://en.wikipedia.org/wiki/Special:FilePath/AC_Reggiana_1919_Logo.svg?width=512",
  "Südtirol": "https://en.wikipedia.org/wiki/Special:FilePath/FC_S%C3%BCdtirol_logo.svg?width=512",
  "Carrarese": "https://en.wikipedia.org/wiki/Special:FilePath/Carrarese_Calcio_1908_logo.svg?width=512",

  // --- 🇫🇷 FRANSA - Ligue 1 ---
  "Angers": "https://en.wikipedia.org/wiki/Special:FilePath/Angers_SCO_logo.svg?width=512",
  "Auxerre": "https://en.wikipedia.org/wiki/Special:FilePath/AJ_Auxerre_logo.svg?width=512",
  "Brest": "https://en.wikipedia.org/wiki/Special:FilePath/Stade_Brestois_29_logo.svg?width=512",
  "Le Havre": "https://en.wikipedia.org/wiki/Special:FilePath/Le_Havre_AC_logo.svg?width=512",
  "Lens": "https://en.wikipedia.org/wiki/Special:FilePath/RC_Lens_logo.svg?width=512",
  "Lille": "https://en.wikipedia.org/wiki/Special:FilePath/LOSC_Lille_Logo.svg?width=512",
  "Lyon": "https://en.wikipedia.org/wiki/Special:FilePath/Olympique_Lyonnais.svg?width=512",
  "Marseille": "https://en.wikipedia.org/wiki/Special:FilePath/Olympique_de_Marseille_logo.svg?width=512",
  "Monaco": "https://en.wikipedia.org/wiki/Special:FilePath/AS_Monaco_FC.svg?width=512",
  "Montpellier": "https://en.wikipedia.org/wiki/Special:FilePath/Montpellier_HSC_logo.svg?width=512",
  "Nantes": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Nantes_logo.svg?width=512",
  "Nice": "https://en.wikipedia.org/wiki/Special:FilePath/OGC_Nice_logo.svg?width=512",
  "PSG": "https://en.wikipedia.org/wiki/Special:FilePath/Paris_Saint-Germain_F.C..svg?width=512",
  "Paris Saint-Germain": "https://en.wikipedia.org/wiki/Special:FilePath/Paris_Saint-Germain_F.C..svg?width=512",
  "Reims": "https://en.wikipedia.org/wiki/Special:FilePath/Stade_de_Reims_logo.svg?width=512",
  "Rennes": "https://en.wikipedia.org/wiki/Special:FilePath/Stade_Rennais_FC_logo.svg?width=512",
  "Saint-Étienne": "https://en.wikipedia.org/wiki/Special:FilePath/AS_Saint-%C3%89tienne_logo.svg?width=512",
  "Strasbourg": "https://en.wikipedia.org/wiki/Special:FilePath/RC_Strasbourg_Alsace_logo.svg?width=512",
  "Toulouse": "https://en.wikipedia.org/wiki/Special:FilePath/Toulouse_FC_logo.svg?width=512",

  // --- 🇫🇷 FRANSA - Ligue 2 ---
  "Metz": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Metz_2021_Logo.svg?width=512",
  "Lorient": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Lorient_logo_%282023%29.svg?width=512",
  "Clermont Foot": "https://en.wikipedia.org/wiki/Special:FilePath/Clermont_Foot_63_logo.svg?width=512",
  "Guingamp": "https://en.wikipedia.org/wiki/Special:FilePath/En_Avant_de_Guingamp_logo.svg?width=512",
  "Paris FC": "https://en.wikipedia.org/wiki/Special:FilePath/Paris_FC_logo.svg?width=512",
  "Caen": "https://en.wikipedia.org/wiki/Special:FilePath/SM_Caen_2016_logo.svg?width=512",
  "Bastia": "https://en.wikipedia.org/wiki/Special:FilePath/SC_Bastia_logo.svg?width=512",
  "Ajaccio": "https://en.wikipedia.org/wiki/Special:FilePath/AC_Ajaccio_logo.svg?width=512",
  "Troyes": "https://en.wikipedia.org/wiki/Special:FilePath/ES_Troyes_AC.svg?width=512",
  "Amiens": "https://en.wikipedia.org/wiki/Special:FilePath/Amiens_SC_Logo.svg?width=512",
  "Annecy": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Annecy_logo.svg?width=512",
  "Dunkerque": "https://en.wikipedia.org/wiki/Special:FilePath/US_Littoral_Dunkerque_logo.svg?width=512",
  "Grenoble": "https://en.wikipedia.org/wiki/Special:FilePath/Grenoble_Foot_38_logo.svg?width=512",
  "Laval": "https://en.wikipedia.org/wiki/Special:FilePath/Stade_Lavallois_Mayenne_FC_logo.svg?width=512",
  "Martigues": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Martigues_logo.svg?width=512",
  "Pau": "https://en.wikipedia.org/wiki/Special:FilePath/Pau_Football_Club_Logo.svg?width=512",
  "Red Star": "https://en.wikipedia.org/wiki/Special:FilePath/Red_Star_FC_logo.svg?width=512",
  "Rodez": "https://en.wikipedia.org/wiki/Special:FilePath/Rodez_AF_logo.svg?width=512",

  // --- 🇹🇷 TÜRKİYƏ - Süper Lig ---
  "Adana Demirspor": "https://en.wikipedia.org/wiki/Special:FilePath/Adana_Demirspor_logo.svg?width=512",
  "Alanyaspor": "https://en.wikipedia.org/wiki/Special:FilePath/Alanyaspor_logo.svg?width=512",
  "Antalyaspor": "https://en.wikipedia.org/wiki/Special:FilePath/Antalyaspor_logo.svg?width=512",
  "Başakşehir": "https://en.wikipedia.org/wiki/Special:FilePath/%C4%B0stanbul_Ba%C5%9Fak%C5%9Fehir_FK.svg?width=512",
  "Beşiktaş": "https://en.wikipedia.org/wiki/Special:FilePath/Besiktas_jk.svg?width=512",
  "Bodrum FK": "https://tr.wikipedia.org/wiki/Special:FilePath/Bodrumspor_logo.png?width=512",
  "Eyüpspor": "https://tr.wikipedia.org/wiki/Special:FilePath/Ey%C3%BCpspor_logo.png?width=512",
  "Fenerbahçe": "https://en.wikipedia.org/wiki/Special:FilePath/Fenerbah%C3%A7e_SK.png?width=512",
  "Galatasaray": "https://en.wikipedia.org/wiki/Special:FilePath/Galatasaray_Sports_Club_Logo.png?width=512",
  "Gaziantep FK": "https://en.wikipedia.org/wiki/Special:FilePath/Gaziantep_FK_logo.svg?width=512",
  "Göztepe": "https://en.wikipedia.org/wiki/Special:FilePath/Goztepe_logo.png?width=512",
  "Hatayspor": "https://en.wikipedia.org/wiki/Special:FilePath/Hatayspor_logo.svg?width=512",
  "Kasımpaşa": "https://en.wikipedia.org/wiki/Special:FilePath/Kasimpasa_logo.svg?width=512",
  "Kayserispor": "https://en.wikipedia.org/wiki/Special:FilePath/Kayserispor_logo.svg?width=512",
  "Konyaspor": "https://en.wikipedia.org/wiki/Special:FilePath/Konyaspor_logo.svg?width=512",
  "Rizespor": "https://en.wikipedia.org/wiki/Special:FilePath/%C3%87aykur_Rizespor_logo.svg?width=512",
  "Samsunspor": "https://tr.wikipedia.org/wiki/Special:FilePath/Samsunspor_logo_2.png?width=512",
  "Sivasspor": "https://en.wikipedia.org/wiki/Special:FilePath/Sivasspor_logo.svg?width=512",
  "Trabzonspor": "https://en.wikipedia.org/wiki/Special:FilePath/Trabzonspor_Amblemi.png?width=512",

  // --- 🇸🇦 SƏUDİYYƏ ƏRƏBİSTANI - Pro League ---
  "Al-Ahli": "https://en.wikipedia.org/wiki/Special:FilePath/Al-Ahli_Saudi_FC_logo.svg?width=512",
  "Al-Ettifaq": "https://en.wikipedia.org/wiki/Special:FilePath/Al-Ettifaq_Club_Logo.svg?width=512",
  "Al-Fateh": "https://en.wikipedia.org/wiki/Special:FilePath/Al-Fateh_SC_logo.svg?width=512",
  "Al-Fayha": "https://en.wikipedia.org/wiki/Special:FilePath/Al_Fayha_FC_logo.svg?width=512",
  "Al-Hilal": "https://en.wikipedia.org/wiki/Special:FilePath/Al_Hilal_SFC_Logo_2022.svg?width=512",
  "Al-Ittihad": "https://en.wikipedia.org/wiki/Special:FilePath/Al_Ittihad_Club_Saudi_Arabia_logo.svg?width=512",
  "Al-Nassr": "https://en.wikipedia.org/wiki/Special:FilePath/Al-Nassr_FC_Logo.svg?width=512",
  "Al-Shabab": "https://en.wikipedia.org/wiki/Special:FilePath/Al_Shabab_FC_Logo.svg?width=512",
  "Al-Taawoun": "https://en.wikipedia.org/wiki/Special:FilePath/Al_Taawoun_FC_logo.svg?width=512",
  "Damac": "https://en.wikipedia.org/wiki/Special:FilePath/Damac_Club_Logo.svg?width=512",

  // --- 🇵🇹 PORTUQALİYA ---
  "Arouca": "https://en.wikipedia.org/wiki/Special:FilePath/F.C._Arouca_logo.svg?width=512",
  "AVS": "https://en.wikipedia.org/wiki/Special:FilePath/AVS_Futebol_SAD_logo.svg?width=512",
  "Benfica": "https://en.wikipedia.org/wiki/Special:FilePath/SL_Benfica_logo.svg?width=512",
  "Boavista": "https://en.wikipedia.org/wiki/Special:FilePath/Boavista_F.C._logo.svg?width=512",
  "Braga": "https://en.wikipedia.org/wiki/Special:FilePath/S.C._Braga_logo.svg?width=512",
  "Casa Pia": "https://en.wikipedia.org/wiki/Special:FilePath/Casa_Pia_A.C._logo.svg?width=512",
  "Estoril": "https://en.wikipedia.org/wiki/Special:FilePath/G.D._Estoril_Praia_logo.svg?width=512",
  "Estrela da Amadora": "https://en.wikipedia.org/wiki/Special:FilePath/C.F._Estrela_da_Amadora_logo.svg?width=512",
  "Famalicão": "https://en.wikipedia.org/wiki/Special:FilePath/F.C._Famalic%C3%A3o_logo.svg?width=512",
  "Farense": "https://en.wikipedia.org/wiki/Special:FilePath/S.C._Farense_logo.svg?width=512",
  "Gil Vicente": "https://en.wikipedia.org/wiki/Special:FilePath/Gil_Vicente_F.C._logo.svg?width=512",
  "Moreirense": "https://en.wikipedia.org/wiki/Special:FilePath/Moreirense_F.C._logo.svg?width=512",
  "Nacional": "https://en.wikipedia.org/wiki/Special:FilePath/C.D._Nacional_logo.svg?width=512",
  "Porto": "https://en.wikipedia.org/wiki/Special:FilePath/Futebol_Clube_do_Porto_Crest.svg?width=512",
  "Rio Ave": "https://en.wikipedia.org/wiki/Special:FilePath/Rio_Ave_F.C._logo.svg?width=512",
  "Santa Clara": "https://en.wikipedia.org/wiki/Special:FilePath/C.D._Santa_Clara_logo.svg?width=512",
  "Sporting CP": "https://en.wikipedia.org/wiki/Special:FilePath/Sporting_Clube_de_Portugal_%28Logo%29.svg?width=512",
  "Vitória de Guimarães": "https://en.wikipedia.org/wiki/Special:FilePath/Vitoria_Guimaraes_logo.svg?width=512",

  // --- 🇳🇱 NİDERLAND ---
  "Ajax": "https://en.wikipedia.org/wiki/Special:FilePath/Ajax_Amsterdam.svg?width=512",
  "Almere City": "https://en.wikipedia.org/wiki/Special:FilePath/Almere_City_FC_logo.svg?width=512",
  "AZ Alkmaar": "https://en.wikipedia.org/wiki/Special:FilePath/AZ_Alkmaar.svg?width=512",
  "Feyenoord": "https://en.wikipedia.org/wiki/Special:FilePath/Feyenoord_logo.svg?width=512",
  "Fortuna Sittard": "https://en.wikipedia.org/wiki/Special:FilePath/Fortuna_Sittard_logo.svg?width=512",
  "Go Ahead Eagles": "https://en.wikipedia.org/wiki/Special:FilePath/Go_Ahead_Eagles_logo.svg?width=512",
  "Groningen": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Groningen_logo.svg?width=512",
  "Heerenveen": "https://en.wikipedia.org/wiki/Special:FilePath/SC_Heerenveen_logo.svg?width=512",
  "Heracles Almelo": "https://en.wikipedia.org/wiki/Special:FilePath/Heracles_Almelo_logo.svg?width=512",
  "NAC Breda": "https://en.wikipedia.org/wiki/Special:FilePath/NAC_Breda_logo.svg?width=512",
  "NEC Nijmegen": "https://en.wikipedia.org/wiki/Special:FilePath/N.E.C._Nijmegen_logo.svg?width=512",
  "PEC Zwolle": "https://en.wikipedia.org/wiki/Special:FilePath/PEC_Zwolle_logo.svg?width=512",
  "PSV Eindhoven": "https://en.wikipedia.org/wiki/Special:FilePath/PSV_Eindhoven.svg?width=512",
  "RKC Waalwijk": "https://en.wikipedia.org/wiki/Special:FilePath/RKC_Waalwijk_logo.svg?width=512",
  "Sparta Rotterdam": "https://en.wikipedia.org/wiki/Special:FilePath/Sparta_Rotterdam_logo.svg?width=512",
  "Twente": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Twente_logo.svg?width=512",
  "Utrecht": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Utrecht_logo.svg?width=512",
  "Willem II": "https://en.wikipedia.org/wiki/Special:FilePath/Willem_II_Tilburg_logo.svg?width=512",

  // --- 🇷🇺 RUSİYA ---
  "Zenit St. Petersburg": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Zenit_St._Petersburg_logo.svg?width=512",
  "Spartak Moscow": "https://en.wikipedia.org/wiki/Special:FilePath/Spartak_Moscow_FC_logo.svg?width=512",
  "CSKA Moscow": "https://en.wikipedia.org/wiki/Special:FilePath/PFC_CSKA_Moscow_Logo.svg?width=512",
  "Krasnodar": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Krasnodar_logo.svg?width=512",
  "Lokomotiv Moscow": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Lokomotiv_Moscow_logo.svg?width=512",
  "Dynamo Moscow": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Dynamo_Moscow_logo.svg?width=512",
  "Rubin Kazan": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Rubin_Kazan_logo.svg?width=512",
  "Rostov": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Rostov_logo.svg?width=512",

  // --- 🌎 AMERİKA (MLS, Braziliya, Argentina) ---
  "Inter Miami": "https://en.wikipedia.org/wiki/Special:FilePath/Inter_Miami_CF_logo.svg?width=512",
  "LA Galaxy": "https://en.wikipedia.org/wiki/Special:FilePath/LA_Galaxy_logo.svg?width=512",
  "Los Angeles FC": "https://en.wikipedia.org/wiki/Special:FilePath/Los_Angeles_FC_logo.svg?width=512",
  "Flamengo": "https://en.wikipedia.org/wiki/Special:FilePath/Flamengo_braz_logo.svg?width=512",
  "Palmeiras": "https://en.wikipedia.org/wiki/Special:FilePath/Palmeiras_logo.svg?width=512",
  "Boca Juniors": "https://en.wikipedia.org/wiki/Special:FilePath/Boca_Juniors_logo18.svg?width=512",
  "River Plate": "https://en.wikipedia.org/wiki/Special:FilePath/Escudo_del_C_A_River_Plate.svg?width=512",
  "Santos": "https://en.wikipedia.org/wiki/Special:FilePath/Santos_Logo.png?width=512",
  "Corinthians": "https://en.wikipedia.org/wiki/Special:FilePath/Sport_Club_Corinthians_Paulista_crest.svg?width=512",
  "São Paulo": "https://en.wikipedia.org/wiki/Special:FilePath/Brasao_do_Sao_Paulo_Futebol_Clube.svg?width=512",
  "Grêmio": "https://en.wikipedia.org/wiki/Special:FilePath/Gremio_logo.svg?width=512",
  "Internacional": "https://en.wikipedia.org/wiki/Special:FilePath/Escudo_do_Sport_Club_Internacional.svg?width=512",
  "Independiente": "https://en.wikipedia.org/wiki/Special:FilePath/Escudo_del_Club_Atl%C3%A9tico_Independiente.svg?width=512",
  "Racing Club": "https://en.wikipedia.org/wiki/Special:FilePath/Racing_Club_%282014%29.svg?width=512",
  "San Lorenzo": "https://en.wikipedia.org/wiki/Special:FilePath/Escudo_del_Club_Atl%C3%A9tico_San_Lorenzo_de_Almagro.svg?width=512",

  // --- 🌍 Digər ---
  "Celtic": "https://en.wikipedia.org/wiki/Special:FilePath/Celtic_FC.svg?width=512",
  "Rangers": "https://en.wikipedia.org/wiki/Special:FilePath/Rangers_FC.svg?width=512",
  "Shakhtar Donetsk": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Shakhtar_Donetsk.svg?width=512",
  "Dynamo Kyiv": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Dynamo_Kyiv_logo.svg?width=512",
  "Olympiacos": "https://en.wikipedia.org/wiki/Special:FilePath/Olympiacos_FC_logo.svg?width=512",
  "Panathinaikos": "https://en.wikipedia.org/wiki/Special:FilePath/Panathinaikos_F.C._logo.svg?width=512",
  "Red Bull Salzburg": "https://en.wikipedia.org/wiki/Special:FilePath/FC_Red_Bull_Salzburg_logo.svg?width=512",
  "Anderlecht": "https://en.wikipedia.org/wiki/Special:FilePath/R.S.C._Anderlecht_logo.svg?width=512",
  "Club Brugge": "https://en.wikipedia.org/wiki/Special:FilePath/Club_Brugge_KV_logo.svg?width=512",
  "Classic Legends": "https://cdn-icons-png.flaticon.com/512/16/16480.png"
};

const getClubsByNames = (names: string[]): ClubData[] => {
  return names.map(name => {
    // Exact match yoxla, yoxdursa " (Ölkə)" hissəsini çıxarıb yenidən yoxla
    let logo = teamLogos[name];
    if (!logo) {
      const cleanName = name.split(' (')[0];
      logo = teamLogos[cleanName];
    }
    return { 
      id: `club-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name, 
      logo: logo || "https://cdn-icons-png.flaticon.com/512/16/16480.png" 
    };
  });
};

export const allFootballClubs: Record<string, ClubData[]> = {
  "🇦🇿 Azərbaycan - Premyer Liqa": getClubsByNames([
    "Qarabağ FK", "Neftçi PFK", "Sabah FK", "Zirə FK", "Sumqayıt FK",
    "Turan Tovuz", "Səbail FK", "Kəpəz PFK", "Araz-Naxçıvan", "Şamaxı FK"
  ]),
  "🏴󠁧󠁢󠁥󠁮󠁧󠁿 İngiltərə - Premier League": getClubsByNames([
    "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton & Hove Albion",
    "Chelsea", "Crystal Palace", "Everton", "Fulham", "Ipswich Town",
    "Leicester City", "Liverpool", "Manchester City", "Manchester United", "Newcastle United",
    "Nottingham Forest", "Southampton", "Tottenham Hotspur", "West Ham United", "Wolverhampton Wanderers"
  ]),
  "🏴󠁧󠁢󠁥󠁮󠁧󠁿 İngiltərə - Championship (2-ci Liqa)": getClubsByNames([
    "Blackburn Rovers", "Bristol City", "Burnley", "Cardiff City", "Coventry City",
    "Derby County", "Hull City", "Leeds United", "Luton Town", "Middlesbrough",
    "Millwall", "Norwich City", "Oxford United", "Plymouth Argyle", "Portsmouth",
    "Preston North End", "Queens Park Rangers", "Sheffield United", "Sheffield Wednesday", "Stoke City",
    "Sunderland", "Swansea City", "Watford", "West Bromwich Albion"
  ]),
  "🇪🇸 İspaniya - La Liga": getClubsByNames([
    "Athletic Bilbao", "Atlético Madrid", "Barcelona", "Celta Vigo", "Deportivo Alavés",
    "Espanyol", "Getafe", "Girona", "Las Palmas", "Leganés",
    "Mallorca", "Osasuna", "Rayo Vallecano", "Real Betis", "Real Madrid",
    "Real Sociedad", "Real Valladolid", "Sevilla", "Valencia", "Villarreal"
  ]),
  "🇪🇸 İspaniya - La Liga 2 (Segunda)": getClubsByNames([
    "Albacete", "Almería", "Burgos", "Cádiz", "Cartagena",
    "Castellón", "Córdoba", "Deportivo La Coruña", "Eibar", "Elche",
    "Eldense", "Ferrol", "Granada", "Huesca", "Levante",
    "Málaga", "Mirandés", "Oviedo", "Racing Santander", "Sporting Gijón",
    "Tenerife", "Zaragoza"
  ]),
  "🇩🇪 Almaniya - Bundesliga": getClubsByNames([
    "Augsburg", "Bayer Leverkusen", "Bayern Munich", "Bochum", "Borussia Dortmund",
    "Borussia Mönchengladbach", "Eintracht Frankfurt", "Freiburg", "Heidenheim", "Hoffenheim",
    "Holstein Kiel", "Mainz 05", "RB Leipzig", "St. Pauli", "Stuttgart",
    "Union Berlin", "Werder Bremen", "Wolfsburg"
  ]),
  "🇩🇪 Almaniya - 2. Bundesliga": getClubsByNames([
    "Darmstadt 98", "Eintracht Braunschweig", "Elversberg", "Fortuna Düsseldorf", "Greuther Fürth",
    "Hamburger SV", "Hannover 96", "Hertha BSC", "Jahn Regensburg", "Kaiserslautern",
    "Karlsruher SC", "Köln", "Magdeburg", "Münster", "Nürnberg",
    "Paderborn", "Schalke 04", "Ulm"
  ]),
  "🇮🇹 İtaliya - Serie A": getClubsByNames([
    "AC Milan", "Atalanta", "Bologna", "Cagliari", "Como",
    "Empoli", "Fiorentina", "Genoa", "Hellas Verona", "Inter Milan",
    "Juventus", "Lazio", "Lecce", "Monza", "Napoli",
    "Parma", "Roma", "Torino", "Udinese", "Venezia"
  ]),
  "🇮🇹 İtaliya - Serie B": getClubsByNames([
    "Bari", "Brescia", "Carrarese", "Catanzaro", "Cesena",
    "Cittadella", "Cosenza", "Cremonese", "Frosinone", "Juve Stabia",
    "Mantova", "Modena", "Palermo", "Pisa", "Reggiana",
    "Salernitana", "Sampdoria", "Sassuolo", "Spezia", "Südtirol"
  ]),
  "🇫🇷 Fransa - Ligue 1": getClubsByNames([
    "Angers", "Auxerre", "Brest", "Le Havre", "Lens",
    "Lille", "Lyon", "Marseille", "Monaco", "Montpellier",
    "Nantes", "Nice", "PSG (Paris Saint-Germain)", "Reims", "Rennes",
    "Saint-Étienne", "Strasbourg", "Toulouse"
  ]),
  "🇫🇷 Fransa - Ligue 2": getClubsByNames([
    "Ajaccio", "Amiens", "Annecy", "Bastia", "Caen",
    "Clermont Foot", "Dunkerque", "Grenoble", "Guingamp", "Laval",
    "Lorient", "Martigues", "Metz", "Paris FC", "Pau",
    "Red Star", "Rodez", "Troyes"
  ]),
  "🇹🇷 Türkiyə - Süper Lig": getClubsByNames([
    "Adana Demirspor", "Alanyaspor", "Antalyaspor", "Başakşehir", "Beşiktaş",
    "Bodrum FK", "Eyüpspor", "Fenerbahçe", "Galatasaray", "Gaziantep FK",
    "Göztepe", "Hatayspor", "Kasımpaşa", "Kayserispor", "Konyaspor",
    "Rizespor", "Samsunspor", "Sivasspor", "Trabzonspor"
  ]),
  "🇵🇹 Portuqaliya - Liga Portugal": getClubsByNames([
    "Arouca", "AVS", "Benfica", "Boavista", "Braga",
    "Casa Pia", "Estoril", "Estrela da Amadora", "Famalicão", "Farense",
    "Gil Vicente", "Moreirense", "Nacional", "Porto", "Rio Ave",
    "Santa Clara", "Sporting CP", "Vitória de Guimarães"
  ]),
  "🇳🇱 Niderland - Eredivisie": getClubsByNames([
    "Ajax", "Almere City", "AZ Alkmaar", "Feyenoord", "Fortuna Sittard",
    "Go Ahead Eagles", "Groningen", "Heerenveen", "Heracles Almelo", "NAC Breda",
    "NEC Nijmegen", "PEC Zwolle", "PSV Eindhoven", "RKC Waalwijk", "Sparta Rotterdam",
    "Twente", "Utrecht", "Willem II"
  ]),
  "🇧🇪 Belçika - Pro League": getClubsByNames([
    "Anderlecht", "Club Brugge", "Antwerp", "Genk", "Gent", "Standard Liège", "Union SG"
  ]),
  "🇷🇺 Rusiya - Premier League": getClubsByNames([
    "Zenit St. Petersburg", "Spartak Moscow", "CSKA Moscow", "Krasnodar", "Lokomotiv Moscow", "Dynamo Moscow", "Rubin Kazan", "Rostov"
  ]),
  "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Şotlandiya - Premiership": getClubsByNames(["Celtic", "Rangers", "Aberdeen", "Hearts"]),
  "🇺🇦 Ukrayna - Premier League": getClubsByNames(["Shakhtar Donetsk", "Dynamo Kyiv"]),
  "🇬🇷 Yunanıstan - Super League": getClubsByNames(["Olympiacos", "Panathinaikos", "PAOK", "AEK Athens"]),
  "🇦🇹 Avstriya - Bundesliga": getClubsByNames(["Red Bull Salzburg", "Rapid Wien", "Sturm Graz", "LASK"]),
  "🇧🇷 Braziliya - Série A": getClubsByNames(["Flamengo", "Palmeiras", "Corinthians", "São Paulo", "Botafogo", "Santos", "Grêmio", "Internacional"]),
  "🇦🇷 Argentina - Primera División": getClubsByNames(["Boca Juniors", "River Plate", "Racing Club", "Independiente", "San Lorenzo"]),
  "🇺🇸 MLS (ABŞ) - Top Clublar": getClubsByNames(["Inter Miami", "LA Galaxy", "Los Angeles FC", "New York City FC"]),
  "🇸🇦 Səudiyyə Ərəbistanı - Pro League": getClubsByNames([
    "Al-Hilal", "Al-Nassr", "Al-Ittihad", "Al-Ahli", "Al-Shabab", "Al-Ettifaq"
  ]),
  "🌍 Digər Avropa Klubları": getClubsByNames([
    "Celtic", "Rangers", "Shakhtar Donetsk", "Dynamo Kyiv", "Olympiacos", "Red Bull Salzburg"
  ]),
  "⭐ Klassik Əfsanələr": getClubsByNames(["Classic Legends"])
};
