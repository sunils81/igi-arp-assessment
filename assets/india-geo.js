/* India states, union territories and their significant towns, for the participant form.
   ─────────────────────────────────────────────────────────────────────────────
   City was a free-text box, and 247 people who filled it produced 42 spellings of
   33 places: Bangalore / Bengaluru / Banglore / BANGALORE; Delhi / New Delhi /
   DELHI / Dehli; Gurgaon / Gurugram / "Gur6"; Faridabad / "Fridabad". One person
   typed the word "Select" into it, which says plainly enough what they expected.
   A further 442 left it blank.

   The list leans towards places with jewellery retail — every state capital, every
   city of real size, and the district towns where clients like GIVA and Jewelbox
   actually have outlets. It is not exhaustive and does not need to be: the form
   keeps an "Other" option so nobody in a small town is ever stuck.

   Spellings are the current official ones (Bengaluru, Gurugram, Thiruvananthapuram),
   with the common older name in brackets where people still use it, so someone
   scanning for "Bangalore" still finds the row. One canonical value is stored. */
(function () {
  var G = {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool',
      'Rajahmundry', 'Tirupati', 'Kakinada', 'Kadapa', 'Anantapur', 'Eluru', 'Ongole',
      'Chittoor', 'Machilipatnam', 'Srikakulam', 'Vizianagaram', 'Proddatur', 'Nandyal',
      'Adoni', 'Amaravati'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tezu', 'Ziro', 'Bomdila',
      'Along', 'Tawang'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur',
      'Bongaigaon', 'Dhubri', 'Diphu', 'North Lakhimpur', 'Sivasagar', 'Goalpara', 'Barpeta'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia', 'Arrah',
      'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Bettiah', 'Saharsa', 'Hajipur',
      'Sasaram', 'Dehri', 'Siwan', 'Motihari', 'Nawada', 'Bihar Sharif'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon',
      'Jagdalpur', 'Raigarh', 'Ambikapur', 'Dhamtari', 'Mahasamund'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar',
      'Gandhinagar', 'Junagadh', 'Anand', 'Nadiad', 'Bharuch', 'Navsari', 'Mehsana',
      'Morbi', 'Surendranagar', 'Gandhidham', 'Vapi', 'Valsad', 'Porbandar', 'Palanpur',
      'Bhuj', 'Veraval', 'Godhra', 'Patan', 'Amreli', 'Botad', 'Dahod'],
    'Haryana': ['Gurugram (Gurgaon)', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar',
      'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Bahadurgarh',
      'Jind', 'Kaithal', 'Rewari', 'Palwal', 'Kurukshetra', 'Narnaul', 'Jhajjar'],
    'Himachal Pradesh': ['Shimla', 'Solan', 'Dharamshala', 'Mandi', 'Baddi', 'Kullu',
      'Hamirpur', 'Una', 'Bilaspur', 'Chamba', 'Nahan', 'Palampur', 'Manali'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Deoghar',
      'Hazaribagh', 'Giridih', 'Ramgarh', 'Phusro', 'Medininagar', 'Chaibasa', 'Dumka'],
    'Karnataka': ['Bengaluru (Bangalore)', 'Mysuru (Mysore)', 'Hubballi (Hubli)',
      'Mangaluru (Mangalore)', 'Belagavi (Belgaum)', 'Kalaburagi (Gulbarga)', 'Davanagere',
      'Ballari (Bellary)', 'Vijayapura (Bijapur)', 'Shivamogga (Shimoga)', 'Tumakuru (Tumkur)',
      'Raichur', 'Bidar', 'Hassan', 'Udupi', 'Chitradurga', 'Kolar', 'Mandya', 'Karwar',
      'Gadag', 'Haveri', 'Chikkamagaluru', 'Bagalkot', 'Koppal', 'Yadgir'],
    'Kerala': ['Thiruvananthapuram (Trivandrum)', 'Kochi (Cochin)', 'Kozhikode (Calicut)',
      'Thrissur', 'Kollam', 'Alappuzha', 'Palakkad', 'Kannur', 'Kottayam', 'Malappuram',
      'Pathanamthitta', 'Idukki', 'Kasaragod', 'Wayanad', 'Ernakulam', 'Guruvayur',
      'Chalakudy', 'Perinthalmanna', 'Tirur', 'Manjeri'],
    'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar',
      'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Katni', 'Singrauli', 'Burhanpur', 'Khandwa',
      'Chhindwara', 'Vidisha', 'Shivpuri', 'Guna', 'Mandsaur', 'Neemuch', 'Hoshangabad',
      'Itarsi', 'Morena', 'Bhind', 'Damoh', 'Sehore'],
    'Maharashtra': ['Mumbai', 'Navi Mumbai', 'Thane', 'Pune', 'Nagpur', 'Nashik',
      'Chhatrapati Sambhajinagar (Aurangabad)', 'Solapur', 'Kolhapur', 'Amravati',
      'Nanded', 'Sangli', 'Jalgaon', 'Akola', 'Latur', 'Ahmednagar', 'Dhule', 'Chandrapur',
      'Parbhani', 'Ichalkaranji', 'Jalna', 'Bhiwandi', 'Panvel', 'Kalyan', 'Dombivli',
      'Vasai-Virar', 'Mira-Bhayandar', 'Satara', 'Beed', 'Yavatmal', 'Osmanabad',
      'Ratnagiri', 'Wardha', 'Gondia', 'Baramati'],
    'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching', 'Ukhrul'],
    'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Baghmara', 'Williamnagar'],
    'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib', 'Saiha'],
    'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri',
      'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda', 'Jeypore', 'Angul', 'Dhenkanal',
      'Rayagada', 'Paradip', 'Kendrapara'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali',
      'Hoshiarpur', 'Pathankot', 'Moga', 'Firozpur', 'Khanna', 'Phagwara', 'Batala',
      'Muktsar', 'Barnala', 'Rajpura', 'Kapurthala', 'Sangrur', 'Fazilka', 'Gurdaspur'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Bhilwara',
      'Alwar', 'Sikar', 'Pali', 'Sri Ganganagar', 'Bharatpur', 'Chittorgarh', 'Hanumangarh',
      'Jhunjhunu', 'Banswara', 'Beawar', 'Tonk', 'Nagaur', 'Churu', 'Dausa', 'Jaisalmer',
      'Barmer', 'Sawai Madhopur', 'Kishangarh'],
    'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo', 'Singtam'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli (Trichy)', 'Salem',
      'Tirunelveli', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi (Tuticorin)', 'Thanjavur',
      'Dindigul', 'Kanchipuram', 'Cuddalore', 'Nagercoil', 'Hosur', 'Karur', 'Namakkal',
      'Sivakasi', 'Kumbakonam', 'Rajapalayam', 'Pudukkottai', 'Virudhunagar', 'Tiruvannamalai',
      'Ooty (Udhagamandalam)', 'Ariyalur', 'Perambalur', 'Ramanathapuram'],
    'Telangana': ['Hyderabad', 'Secunderabad', 'Warangal', 'Nizamabad', 'Karimnagar',
      'Khammam', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet',
      'Siddipet', 'Miryalaguda', 'Jagtial', 'Sangareddy'],
    'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar', 'Belonia', 'Ambassa'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut',
      'Prayagraj (Allahabad)', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur',
      'Noida', 'Greater Noida', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura',
      'Ayodhya (Faizabad)', 'Rampur', 'Shahjahanpur', 'Farrukhabad', 'Hapur', 'Etawah',
      'Mirzapur', 'Bulandshahr', 'Sitapur', 'Bahraich', 'Unnao', 'Raebareli', 'Sultanpur',
      'Jaunpur', 'Banda', 'Lakhimpur', 'Deoria', 'Azamgarh', 'Basti', 'Mau', 'Ghazipur'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur',
      'Rishikesh', 'Nainital', 'Mussoorie', 'Pithoragarh', 'Almora', 'Kotdwar'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman (Burdwan)',
      'Malda', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Krishnanagar', 'Darjeeling',
      'Haldia', 'Raiganj', 'Jalpaiguri', 'Bankura', 'Purulia', 'Cooch Behar', 'Midnapore',
      'Barasat', 'Serampore', 'Chandannagar', 'Bidhannagar (Salt Lake)'],

    /* Union Territories */
    'Andaman and Nicobar Islands': ['Port Blair', 'Car Nicobar', 'Mayabunder', 'Diglipur'],
    'Chandigarh': ['Chandigarh'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Silvassa', 'Daman', 'Diu'],
    'Delhi': ['New Delhi', 'Delhi (Central)', 'North Delhi', 'South Delhi', 'East Delhi',
      'West Delhi', 'Dwarka', 'Rohini', 'Pitampura', 'Karol Bagh', 'Lajpat Nagar',
      'Saket', 'Janakpuri', 'Nehru Place', 'Connaught Place'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur',
      'Kathua', 'Sopore', 'Kupwara'],
    'Ladakh': ['Leh', 'Kargil'],
    'Lakshadweep': ['Kavaratti', 'Agatti', 'Minicoy'],
    'Puducherry': ['Puducherry (Pondicherry)', 'Karaikal', 'Yanam', 'Mahe']
  };

  /* Which state each IGI centre sits in, so the form can arrive already filled in for
     the usual case: the assessment names the centre, the centre implies the state and
     the city. Someone from an outlet elsewhere just changes it. */
  var CENTRE_TO_PLACE = {
    'Mumbai':     { state: 'Maharashtra',    city: 'Mumbai' },
    'Delhi':      { state: 'Delhi',          city: 'New Delhi' },
    'Kolkata':    { state: 'West Bengal',    city: 'Kolkata' },
    'Chennai':    { state: 'Tamil Nadu',     city: 'Chennai' },
    'Bangalore':  { state: 'Karnataka',      city: 'Bengaluru (Bangalore)' },
    'Bengaluru':  { state: 'Karnataka',      city: 'Bengaluru (Bangalore)' },
    'Hyderabad':  { state: 'Telangana',      city: 'Hyderabad' },
    'Ahmedabad':  { state: 'Gujarat',        city: 'Ahmedabad' },
    'Surat':      { state: 'Gujarat',        city: 'Surat' },
    'Jaipur':     { state: 'Rajasthan',      city: 'Jaipur' },
    'Lucknow':    { state: 'Uttar Pradesh',  city: 'Lucknow' },
    'Thrissur':   { state: 'Kerala',         city: 'Thrissur' },
    'Coimbatore': { state: 'Tamil Nadu',     city: 'Coimbatore' }
  };

  /* Older spellings people still type, mapped to the row they should land on. Used to
     match a prefill or a legacy value against the list rather than losing it. */
  var ALIASES = {
    'bangalore': 'Bengaluru (Bangalore)', 'banglore': 'Bengaluru (Bangalore)',
    'bengaluru': 'Bengaluru (Bangalore)', 'mysore': 'Mysuru (Mysore)',
    'hubli': 'Hubballi (Hubli)', 'mangalore': 'Mangaluru (Mangalore)',
    'belgaum': 'Belagavi (Belgaum)', 'gulbarga': 'Kalaburagi (Gulbarga)',
    'bellary': 'Ballari (Bellary)', 'bijapur': 'Vijayapura (Bijapur)',
    'shimoga': 'Shivamogga (Shimoga)', 'tumkur': 'Tumakuru (Tumkur)',
    'gurgaon': 'Gurugram (Gurgaon)', 'gurugram': 'Gurugram (Gurgaon)',
    'trivandrum': 'Thiruvananthapuram (Trivandrum)', 'cochin': 'Kochi (Cochin)',
    'calicut': 'Kozhikode (Calicut)', 'trichy': 'Tiruchirappalli (Trichy)',
    'tuticorin': 'Thoothukudi (Tuticorin)', 'allahabad': 'Prayagraj (Allahabad)',
    'faizabad': 'Ayodhya (Faizabad)', 'aurangabad': 'Chhatrapati Sambhajinagar (Aurangabad)',
    'burdwan': 'Bardhaman (Burdwan)', 'salt lake': 'Bidhannagar (Salt Lake)',
    'pondicherry': 'Puducherry (Pondicherry)', 'ooty': 'Ooty (Udhagamandalam)',
    'delhi': 'New Delhi', 'new delhi': 'New Delhi', 'bombay': 'Mumbai',
    'madras': 'Chennai', 'calcutta': 'Kolkata', 'poona': 'Pune',
    /* Misspellings that are actually in the existing 689 rows. They cost nothing to
       carry and mean a legacy value still finds its row instead of being dropped. */
    'dehli': 'New Delhi', 'fridabad': 'Faridabad', 'ghazuabad': 'Ghaziabad',
    'banaglore': 'Bengaluru (Bangalore)', 'hyderbad': 'Hyderabad',
    'kolkatta': 'Kolkata', 'chennai ': 'Chennai'
  };

  var STATES = Object.keys(G).sort();

  /* Finds a state+city for a value typed in the past or carried from elsewhere, so a
     legacy "Banglore" still lands on the right row instead of being dropped. */
  function resolve(cityish) {
    var want = String(cityish || '').trim().toLowerCase();
    if (!want) return null;
    var canonical = ALIASES[want] || null;
    for (var i = 0; i < STATES.length; i++) {
      var list = G[STATES[i]];
      for (var j = 0; j < list.length; j++) {
        var c = list[j];
        if (c === canonical || c.toLowerCase() === want ||
            c.toLowerCase().replace(/\s*\([^)]*\)/, '') === want) {
          return { state: STATES[i], city: c };
        }
      }
    }
    return null;
  }

  window.IGIGeo = {
    states: STATES,
    citiesOf: function (state) { return (G[state] || []).slice().sort(); },
    forCentre: function (centre) { return CENTRE_TO_PLACE[String(centre || '').trim()] || null; },
    resolve: resolve,
    /* What gets stored: the plain name without the bracketed older spelling, so the
       database holds one value per place rather than a display label. */
    store: function (city) { return String(city || '').replace(/\s*\([^)]*\)\s*$/, '').trim(); }
  };
})();
