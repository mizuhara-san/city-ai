// cities.js - Indian States & Cities (All Cities Sorted Alphabetically - 2026)

var state_arr = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand",
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

var city_arr = new Array();
city_arr[0] = "";

// Helper function to sort cities alphabetically
function sortCities(citiesStr) {
  if (!citiesStr) return "";
  return citiesStr.split("|").sort((a, b) => a.localeCompare(b)).join("|");
}

// 1. Andaman and Nicobar Islands
city_arr[1] = sortCities("Port Blair|Car Nicobar|Diglipur|Hut Bay|Mayabunder|Rangat|Campbell Bay");

// 2. Andhra Pradesh
city_arr[2] = sortCities("Adoni|Amalapuram|Anantapur|Attili|Badvel|Bhadrachalam|Bobbili|Chilakaluripet|Chirala|Chittoor|Dharmavaram|Eluru|Giddalur|Gooty|Gudivada|Gudur|Guntakal|Hindupur|Jaggayyapeta|Jammalamadugu|Kadapa|Kadiri|Kakinada|Kalyandurg|Kandukur|Kanigiri|Kavali|Kothapeta|Kovvur|Kurnool|Macherla|Machilipatnam|Madakasira|Madhira|Mandapeta|Markapur|Nandyal|Narasaraopet|Narsipatnam|Narsapur|Naidupeta|Nandigama|Nandikotkur|Nuzvid|Ongole|Palacole|Palakollu|Palamaner|Parvathipuram|Pedana|Peddapuram|Proddatur|Punganur|Rajahmundry|Rajampet|Rayachoti|Rayadurg|Repalle|Salur|Samalkot|Sattenapalle|Srikakulam|Tadepalligudem|Tanuku|Tenali|Tirupati|Tuni|Vinukonda|Vizianagaram|Visakhapatnam");

// 3. Arunachal Pradesh
city_arr[3] = sortCities("Aalo|Bomdila|Daporijo|Itanagar|Khonsa|Koloriang|Pasighat|Roing|Seppa|Tawang|Tezu|Yingkiong|Ziro");

// 4. Assam
city_arr[4] = sortCities("Barpeta|Bongaigaon|Dhekiajuli|Dhubri|Dibrugarh|Diphu|Goalpara|Golaghat|Guwahati|Hailakandi|Hojai|Jorhat|Karimganj|Lanka|Mariani|Morigaon|Nagaon|Nalbari|North Lakhimpur|Rangia|Silchar|Sivasagar|Tezpur|Tinsukia");

// 5. Bihar
city_arr[5] = sortCities("Araria|Arrah|Aurangabad|Bagaha|Begusarai|Bettiah|Bhabua|Bihar Sharif|Chhapra|Danapur|Darbhanga|Dehri|Forbesganj|Gaya|Gopalganj|Hajipur|Jamalpur|Jehanabad|Katihar|Khagaria|Kishanganj|Lakhisarai|Madhubani|Motihari|Muzaffarpur|Munger|Naugachia|Patna|Phulwari Sharif|Purnia|Saharsa|Samastipur|Sheikhpura|Sitamarhi|Siwan|Supaul");

// 6. Chandigarh
city_arr[6] = "Chandigarh";

// 7. Chhattisgarh
city_arr[7] = sortCities("Ambikapur|Baloda Bazar|Bhatapara|Bhilai|Bilaspur|Chirmiri|Dhamtari|Durg|Jagdalpur|Janjgir|Kanker|Kawardha|Korba|Mahasamund|Raigarh|Raipur|Rajnandgaon");

// 8. Dadra and Nagar Haveli and Daman and Diu
city_arr[8] = sortCities("Daman|Diu|Silvassa");

// 9. Delhi
city_arr[9] = sortCities("Delhi|New Delhi");

// 10. Goa
city_arr[10] = sortCities("Bicholim|Canacona|Curchorem|Mapusa|Margao|Panaji|Ponda|Quepem|Sanguem|Valpoi|Vasco da Gama");

// 11. Gujarat
city_arr[11] = sortCities("Adipur|Ahmedabad|Amreli|Anand|Ankleshwar|Bardoli|Bharuch|Bhavnagar|Bhuj|Botad|Chandkheda|Dahod|Deesa|Dehgam|Dholka|Dhoraji|Gandhidham|Gandhinagar|Godhra|Himatnagar|Jamnagar|Junagadh|Kalol|Kapadvanj|Keshod|Khambhat|Kheda|Lunawada|Mahisagar|Mahesana|Modasa|Morbi|Nadiad|Navsari|Palanpur|Patan|Petlad|Porbandar|Rajkot|Ranip|Savarkundla|Sidhpur|Surat|Surendranagar|Unjha|Vadodara|Vapi|Veraval|Visnagar|Vyara");

// 12. Haryana
city_arr[12] = sortCities("Ambala|Bahadurgarh|Bhiwani|Charkhi Dadri|Faridabad|Fatehabad|Gurugram|Hansi|Hisar|Jhajjar|Jind|Kaithal|Karnal|Kurukshetra|Mahendragarh|Narnaul|Panchkula|Panipat|Rewari|Rohtak|Sirsa|Sonipat|Yamunanagar");

// 13. Himachal Pradesh
city_arr[13] = sortCities("Arki|Bilaspur|Chamba|Dharamshala|Hamirpur|Kullu|Mandi|Manali|Nahan|Palampur|Paonta Sahib|Shimla|Solan|Una");

// 14. Jammu and Kashmir
city_arr[14] = sortCities("Anantnag|Baramulla|Jammu|Kathua|Kupwara|Poonch|Pulwama|Rajouri|Sopore|Srinagar|Udhampur");

// 15. Jharkhand
city_arr[15] = sortCities("Bokaro|Chas|Chirkunda|Deoghar|Dhanbad|Giridih|Gumia|Hazaribagh|Jamshedpur|Medininagar|Phusro|Ramgarh|Ranchi|Sahibganj");

// 16. Karnataka
city_arr[16] = sortCities("Afzalpur|Aland|Alur|Anekal|Arkalgud|Athani|Bagalkot|Belagavi|Bellary|Bengaluru|Bhadravati|Bijapur|Chikkaballapur|Chikkamagaluru|Chitradurga|Davangere|Gadag-Betageri|Gangavati|Gokak|Gulbarga|Hassan|Hospet|Hubli|Kolar|Lakshmeshwar|Mangalore|Mudhol|Mundargi|Mysuru|Rabkavi Banhatti|Raichur|Ranebennur|Ranibennur|Robertsonpet|Sankeshwar|Shahabad|Shivamogga|Sidlaghatta|Sindhanur|Sirsi|Talikoti|Tumakuru|Udupi|Vadigenhalli");

// 17. Kerala
city_arr[17] = sortCities("Alappuzha|Aluva|Angamaly|Attingal|Chalakudy|Changanassery|Chavakkad|Cherpulassery|Cherthala|Guruvayur|Irinjalakuda|Kalady|Kalamassery|Kanhangad|Kannur|Kasaragod|Kayamkulam|Kochi|Kodungallur|Kollam|Kothamangalam|Kottakkal|Kottarakara|Kottayam|Koyilandy|Kunnamkulam|Malappuram|Manjeri|Mattanur|Mavelikkara|Nedumangad|Neyyattinkara|Nilambur|Palakkad|Paravur|Pathanamthitta|Payyannur|Perinthalmanna|Perumbavoor|Ponnani|Punalur|Thalassery|Thiruvananthapuram|Thodupuzha|Thrissur|Tirur|Tiruvalla|Vaikom|Vadakara");

// 18. Ladakh
city_arr[18] = sortCities("Kargil|Leh|Padum");

// 19. Lakshadweep
city_arr[19] = sortCities("Agatti|Amini|Andrott|Bitra|Chetlat|Kadmat|Kavaratti|Kiltan|Minicoy");

// 20. Madhya Pradesh
city_arr[20] = sortCities("Alirajpur|Anuppur|Ashoknagar|Balaghat|Barwani|Betul|Bhind|Bhind|Bhopal|Burhanpur|Chhatarpur|Chhindwara|Damoh|Datia|Dewas|Dhar|Guna|Gwalior|Harda|Hoshangabad|Indore|Jabalpur|Katni|Khandwa|Khargone|Mandla|Mandsaur|Morena|Narmadapuram|Neemuch|Panna|Raisen|Rajgarh|Ratlam|Raisen|Rewa|Sagar|Satna|Sehore|Seoni|Shahdol|Shajapur|Sheopur|Shivpuri|Sidhi|Singrauli|Tikamgarh|Ujjain|Umaria|Vidisha");

// 21. Maharashtra
city_arr[21] = sortCities("Achlpur|Ahmednagar|Akola|Akot|Amalner|Ambejogai|Amravati|Anjangaon|Aurangabad|Badlapur|Ballarpur|Baramati|Barshi|Basmath|Beed|Bhandara|Bhiwandi|Bhivandi|Bhudargad|Bhusawal|Buldhana|Chalisgaon|Chandrapur|Chikhli|Chiplun|Daund|Deolali|Devgad|Dhule|Digras|Dombivli|Gadchiroli|Gondia|Hinganghat|Ichalkaranji|Jalna|Jalgaon|Kalyan|Kamptee|Karanja|Khadki|Khopoli|Kolhapur|Kopargaon|Latur|Lonavala|Lonar|Mahad|Malegaon|Malkapur|Manchar|Mangrulpir|Mumbai|Murtizapur|Nagpur|Nanded|Nandura|Nandurbar|Navi Mumbai|Nilanga|Osmanabad|Ozar|Pandharpur|Panvel|Parbhani|Parli|Phaltan|Pulgaon|Pune|Pusad|Rahuri|Rajura|Ratnagiri|Sangamner|Sangli|Satana|Satara|Sawantwadi|Shahada|Shegaon|Shirdi|Shirpur|Shrirampur|Silvassa|Sinnar|Solapur|Tasgaon|Thane|Tuljapur|Udgir|Ulhasnagar|Umred|Uran|Vaduj|Vaijapur|Vasai|Virar|Wai|Wani|Wardha|Warud|Washim|Yavatmal|Yawal");

// 22. Manipur
city_arr[22] = sortCities("Bishnupur|Churachandpur|Imphal|Kakching|Lilong|Mayang Imphal|Thoubal");

// 23. Meghalaya
city_arr[23] = sortCities("Baghmara|Jowai|Mairang|Nongpoh|Nongstoin|Resubelpara|Shillong|Tura|Williamnagar");

// 24. Mizoram
city_arr[24] = sortCities("Aizawl|Champhai|Kolasib|Lawngtlai|Lunglei|Mamit|Saiha|Serchhip");

// 25. Nagaland
city_arr[25] = sortCities("Dimapur|Kohima|Kiphire|Longleng|Mokokchung|Mon|Phek|Tuensang|Wokha|Zunheboto");

// 26. Odisha
city_arr[26] = sortCities("Angul|Balangir|Balasore|Barbil|Baripada|Bargarh|Berhampur|Bhadrak|Bhubaneswar|Bolangir|Brajarajnagar|Cuttack|Dhenkanal|Jagatsinghpur|Jajpur|Jeypore|Jharsuguda|Kendrapara|Kendujhar|Khurda|Malkangiri|Nabarangpur|Nayagarh|Nuapada|Paradip|Phulbani|Puri|Rayagada|Rourkela|Sambalpur|Sonepur|Subarnapur|Titlagarh");

// 27. Puducherry
city_arr[27] = sortCities("Karaikal|Mahe|Puducherry|Yanam");

// 28. Punjab
city_arr[28] = sortCities("Abohar|Adampur|Amritsar|Barnala|Batala|Bathinda|Dasuya|Dhuri|Doraha|Fatehgarh Sahib|Fazilka|Firozpur|Hoshiarpur|Jagraon|Jalandhar|Kapurthala|Kartarpur|Khanna|Ludhiana|Malerkotla|Malout|Mansa|Maur|Moga|Muktsar|Nabha|Nakodar|Nawanshahr|Pathankot|Patiala|Phagwara|Phillaur|Rajpura|Raikot|Rampura Phul|Samana|Sangrur|Shahkot|Sunam|Talwara|Zirakpur");

// 29. Rajasthan
city_arr[29] = sortCities("Abu Road|Ajmer|Alwar|Banswara|Baran|Barmer|Beawar|Bharatpur|Bhilwara|Bikaner|Bundi|Chittorgarh|Churu|Deeg|Didwana|Dholpur|Fatehpur|Hanumangarh|Hindaun|Jalore|Jaipur|Jhalawar|Jhunjhunu|Jodhpur|Karauli|Kishangarh|Kota|Kuchaman City|Ladnu|Makrana|Mount Abu|Nagaur|Nasirabad|Nawalgarh|Neem ka Thana|Nohar|Pilani|Rajsamand|Ratangarh|Sardarshahar|Sawai Madhopur|Sikar|Sujangarh|Tonk");

// 30. Sikkim
city_arr[30] = sortCities("Gangtok|Geyzing|Jorethang|Mangan|Namchi|Pelling|Rangpo|Singtam");

// 31. Tamil Nadu
city_arr[31] = sortCities("Ambattur|Ambur|Arakkonam|Arani|Arcot|Aruppukkottai|Attur|Avadi|Bhavani|Chengalpattu|Chennai|Chidambaram|Coimbatore|Cuddalore|Dharapuram|Dindigul|Erode|Gobichettipalayam|Gudalur|Gudiyatham|Hosur|Kancheepuram|Karaikudi|Karur|Kovilpatti|Krishnagiri|Kumbakonam|Mannargudi|Mayiladuthurai|Nagapattinam|Nagercoil|Namakkal|Neyveli|Palani|Pallavaram|Panruti|Paramakudi|Perambalur|Pudukkottai|Rajapalayam|Ranipet|Salem|Sankarankovil|Sivakasi|Sivaganga|Tambaram|Tenka si|Thanjavur|Theni|Thiruvallur|Thiruvannamalai|Thiruvarur|Thoothukudi|Tindivanam|Tiruchengode|Tirunelveli|Tirupathur|Tiruppur|Tiruvottiyur|Udhagamandalam|Vaniyambadi|Vellore|Villupuram|Virudhunagar");

// 32. Telangana
city_arr[32] = sortCities("Adilabad|Bhadradri Kothagudem|Hyderabad|Jagtial|Jangaon|Jayashankar Bhupalpally|Jogulamba Gadwal|Kamareddy|Karimnagar|Khammam|Komaram Bheem|Mahabubabad|Mahbubnagar|Mancherial|Medak|Miryalaguda|Nagarkurnool|Nalgonda|Nirmal|Nizamabad|Peddapalli|Rajanna Sircilla|Ramagundam|Sangareddy|Siddipet|Sircilla|Suryapet|Vikarabad|Wanaparthy|Warangal|Yadadri Bhuvanagiri");

// 33. Tripura
city_arr[33] = sortCities("Agartala|Ambassa|Belonia|Bishalgarh|Dharmanagar|Kailasahar|Kamalpur|Khowai|Kumarghat|Melaghar|Panisagar|Sonamura|Udaipur");

// 34. Uttar Pradesh
city_arr[34] = sortCities("Agra|Aligarh|Ambedkar Nagar|Amethi|Amroha|Auraiya|Ayodhya|Azamgarh|Baghpat|Bahraich|Ballia|Balrampur|Banda|Barabanki|Bareilly|Basti|Bhadohi|Bijnor|Budaun|Bulandshahr|Chandauli|Chitrakoot|Deoria|Etah|Etawah|Farrukhabad|Fatehpur|Firozabad|Ghaziabad|Gonda|Gorakhpur|Hapur|Hathras|Jalaun|Jaunpur|Jhansi|Jyotiba Phule Nagar|Kannauj|Kanpur|Kasganj|Kaushambi|Kheri|Kushinagar|Lakhimpur|Lucknow|Mau|Maharajganj|Mahoba|Mainpuri|Mathura|Meerut|Mirzapur|Moradabad|Muzaffarnagar|Phulpur|Pilibhit|Prayagraj|Rae Bareli|Rampur|Saharanpur|Sambhal|Shahjahanpur|Shamli|Shravasti|Sidharthnagar|Sitapur|Sultanpur|Unnao|Varanasi");

// 35. Uttarakhand
city_arr[35] = sortCities("Almora|Bageshwar|Chamoli|Champawat|Dehradun|Haridwar|Nainital|Pauri|Pithoragarh|Rudraprayag|Tehri|Udham Singh Nagar|Uttarkashi");

// 36. West Bengal
city_arr[36] = sortCities("Alipurduar|Asansol|Baharampur|Balurghat|Bankura|Bardhaman|Birbhum|Cooch Behar|Darjeeling|Durgapur|Haldia|Howrah|Jalpaiguri|Kharagpur|Kolkata|Krishnanagar|Malda|Medinipur|Murshidabad|Nadia|North 24 Parganas|Purba Medinipur|Purulia|Raiganj|Siliguri|South 24 Parganas");

function print_state(state_id) {
  var option_str = document.getElementById(state_id);
  option_str.length = 0;
  option_str.options[0] = new Option('Select State', '');
  option_str.selectedIndex = 0;
  for (var i = 0; i < state_arr.length; i++) {
    option_str.options[option_str.length] = new Option(state_arr[i], state_arr[i]);
  }
}

function print_city(city_id, state_index) {
  var option_str = document.getElementById(city_id);
  option_str.length = 0;
  option_str.options[0] = new Option('Select City/Town', '');
  option_str.selectedIndex = 0;
  var city_split = city_arr[state_index].split("|");
  for (var i = 0; i < city_split.length; i++) {
    option_str.options[option_str.length] = new Option(city_split[i], city_split[i]);
  }
}