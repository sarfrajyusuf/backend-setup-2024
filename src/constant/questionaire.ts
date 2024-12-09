import { Answers, Questions } from "models";

const countries = {
  "Aruba": 1,
  "Afghanistan": 1,
  "Angola": 1,
  "Anguilla": 1,
  "Åland Islands": 1,
  "Albania": 1,
  "Andorra": 1,
  "Netherlands Antilles": 1,
  "United Arab Emirates": 1,
  "Argentina": 1,
  "Armenia": 1,
  "American Samoa": 1,
  "Antarctica": 1,
  "French Southern Territories": 1,
  "Antigua and Barbuda": 1,
  "Australia": 1,
  "Austria": 1,
  "Azerbaijan": 1,
  "Burundi": 1,
  "Belgium": 1,
  "Benin": 1,
  "Bonaire, Sint Eustatius and Saba": 1,
  "Burkina Faso": 8,
  "Bangladesh": 1,
  "Bulgaria": 8,
  "Bahrain": 1,
  "Bahamas": 1,
  "Bosnia and Herzegovina": 1,
  "Saint Barthélemy": 1,
  "Belarus": 1,
  "Belize": 1,
  "Bermuda": 1,
  "Bolivia (Plurinational State of)": 1,
  "Brazil": 1,
  "Barbados": 1,
  "Brunei Darussalam": 1,
  "Bhutan": 1,
  "Bouvet Island": 1,
  "Botswana": 1,
  "Central African Republic": 1,
  "Canada": 1,
  "Cocos (Keeling) Islands": 1,
  "Switzerland": 1,
  "Chile": 1,
  "China": 1,
  "Côte d'Ivoire": 1,
  "Cameroon": 8,
  "Congo (Democratic Republic of the)": 1,
  "Congo": 1,
  "Cook Islands": 1,
  "Colombia": 1,
  "Comoros": 1,
  "Cabo Verde": 1,
  "Costa Rica": 1,
  "Cuba": 1,
  "Curaçao": 1,
  "Christmas Island": 1,
  "Cayman Islands": 1,
  "Cyprus": 1,
  "Czech Republic": 1,
  "Germany": 1,
  "Djibouti": 1,
  "Dominica": 1,
  "Denmark": 1,
  "Dominican Republic": 1,
  "Algeria": 1,
  "Ecuador": 1,
  "Egypt": 1,
  "Eritrea": 1,
  "Western Sahara": 1,
  "Spain": 1,
  "Estonia": 1,
  "Ethiopia": 1,
  "Finland": 1,
  "Fiji": 1,
  "Falkland Islands (Malvinas)": 1,
  "France": 1,
  "Faroe Islands": 1,
  "Micronesia": 1,
  "Gabon": 1,
  "United Kingdom": 1,
  "Georgia": 1,
  "Guernsey": 1,
  "Ghana": 1,
  "Gibraltar": 1,
  "Guinea": 1,
  "Guadeloupe": 1,
  "Gambia": 1,
  "Guinea-Bissau": 1,
  "Equatorial Guinea": 1,
  "Greece": 1,
  "Grenada": 1,
  "Greenland": 1,
  "Guatemala": 1,
  "French Guiana": 1,
  "Guam": 1,
  "Guyana": 1,
  "Hong Kong": 1,
  "Heard Island and McDonald Islands": 1,
  "Honduras": 1,
  "Croatia": 8,
  "Haiti": 8,
  "Hungary": 1,
  "Indonesia": 1,
  "Isle of Man": 1,
  "India": 1,
  "British Indian Ocean Territory": 1,
  "Ireland": 1,
  "Iran": 1,
  "Iraq": 1,
  "Iceland": 1,
  "Israel": 1,
  "Italy": 1,
  "Jamaica": 8,
  "Jersey": 1,
  "Jordan": 1,
  "Japan": 1,
  "Kazakhstan": 1,
  "Kenya": 8,
  "Kyrgyzstan": 1,
  "Cambodia": 1,
  "Kiribati": 1,
  "Saint Kitts and Nevis": 1,
  "South Korea": 1,
  "Kuwait": 1,
  "Laos": 1,
  "Lebanon": 1,
  "Liberia": 1,
  "Libya": 1,
  "Saint Lucia": 1,
  "Liechtenstein": 1,
  "Sri Lanka": 1,
  "Lesotho": 1,
  "Lithuania": 1,
  "Luxembourg": 1,
  "Latvia": 1,
  "Macao": 1,
  "Saint Martin": 1,
  "Morocco": 1,
  "Monaco": 1,
  "Moldova (Republic of)": 1,
  "Madagascar": 1,
  "Maldives": 1,
  "Mexico": 1,
  "Marshall Islands": 1,
  "Macedonia ": 1,
  "Mali": 8,
  "Malta": 1,
  "Myanmar": 1,
  "Montenegro": 1,
  "Mongolia": 1,
  "Northern Mariana Islands": 1,
  "Mozambique": 8,
  "Mauritania": 1,
  "Montserrat": 1,
  "Martinique": 1,
  "Mauritius": 1,
  "Malawi": 1,
  "Malaysia": 1,
  "Mayotte": 1,
  "Namibia": 8,
  "New Caledonia": 1,
  "Niger": 1,
  "Norfolk Island": 1,
  "Nigeria": 8,
  "Nicaragua": 1,
  "Niue": 1,
  "Netherlands": 1,
  "Norway": 1,
  "Nepal": 1,
  "Nauru": 1,
  "New Zealand": 1,
  "Oman": 1,
  "Pakistan": 1,
  "Panama": 1,
  "Pitcairn": 1,
  "Peru": 1,
  "Philippines": 8,
  "Palau": 1,
  "Papua New Guinea": 1,
  "Poland": 1,
  "Puerto Rico": 1,
  "North Korea": 1,
  "Portugal": 1,
  "Paraguay": 1,
  "Palestine, State of": 1,
  "French Polynesia": 1,
  "Qatar": 1,
  "Réunion": 1,
  "Kosovo": 1,
  "Romania": 1,
  "Russia": 1,
  "Rwanda": 1,
  "Saudi Arabia": 1,
  "Sudan": 1,
  "Senegal": 8,
  "Singapore": 1,
  "South Georgia and the South Sandwich Islands": 1,
  "Saint Helena": 1,
  "Svalbard and Jan Mayen": 1,
  "Solomon Islands": 1,
  "Sierra Leone": 1,
  "El Salvador": 1,
  "San Marino": 1,
  "Somalia": 1,
  "Saint Pierre and Miquelon": 1,
  "Serbia": 1,
  "South Sudan": 8,
  "Sao Tome and Principe": 1,
  "Suriname": 1,
  "Slovakia": 1,
  "Slovenia": 1,
  "Sweden": 1,
  "Eswatini": 1,
  "Sint Maarten (Dutch part)": 1,
  "Seychelles": 1,
  "Syrian Arab Republic": 1,
  "Turks and Caicos Islands": 1,
  "Chad": 1,
  "Togo": 1,
  "Thailand": 1,
  "Tajikistan": 1,
  "Tokelau": 1,
  "Turkmenistan": 1,
  "Timor-Leste": 1,
  "Tonga": 1,
  "Trinidad and Tobago": 1,
  "Tunisia": 1,
  "Turkey": 1,
  "Tuvalu": 1,
  "Taiwan": 1,
  "Tanzania, United Republic of": 1,
  "Uganda": 1,
  "Ukraine": 1,
  "Minor Outlying Islands (United States)": 1,
  "Uruguay": 1,
  "United States of America": 1,
  "Uzbekistan": 1,
  "Vatican": 1,
  "Saint Vincent and the Grenadines": 1,
  "Venezuela": 1,
  "Virgin Islands (British)": 1,
  "Virgin Islands (U.S.)": 1,
  "Viet Nam": 1,
  "Vanuatu": 1,
  "Wallis and Futuna": 1,
  "Samoa": 1,
  "Yemen": 8,
  "South Africa": 8,
  "Zambia": 1,
  "Zimbabwe": 1,
};

export const questionsIndividual = {
  // Individual Account Information
  individualAccountInf: {
    // First Name
    firstName: 'text',
    // Middle Name
    middleName: 'text',
    // Last Name
    lastName: 'text',
    // National ID number
    nationalIdNumber: 'text',
    // Gender
    gender: {
      Male: 0,
      Female: 0,
      Transgender: 0,
      'Non-binary/non-conforming': 0,
    },
    // Address - Street
    addressStreet: 'text',
    // Address - Street 2
    addressStreet2: 'text',
    // City/ Town
    cityTown: 'text',
    // Country
    country: countries,
    // Zip Code
    zipCode: 'text',
    // #8 Are you politically exposed person
    areYouPoliticallyExp: {
      Yes: 30,
      No: 0,
    },
  },
};

/*
-
*/

// import db

const questions = [
  {
    title: 'Propose of account open',
    key: 'purposeOfAccountOpen',
    type: 'individual',
    answers: {
      'I need an account to manage my funds.': 1,
      'I want to store, send, receive and exchange cryptos.': 7,
      'I would like to have a debit card.': 3,
      'Other': 8,
    }
  },
  {
    title: 'Estimated monthly volu',
    key: 'estimatedMonthlyVolu',
    type: 'individual',
    answers: {
      '0-$10,000': 1,
      '$10,000-$50,000': 2,
      '$50,000-$100,000': 5,
      '$100,000-$250,000': 8,
      '$250,000-$500,000': 10,
      '$500,000-$1,000,000': 10,
      '$1,000,000+': 10,
    }
  },
  {
    title: 'Select source of wealth',
    key: 'selectSourceOfWealth',
    type: 'individual',
    answers: {
      'Retired (receiving state or occupational pension)': 1,
      'Salaried Employee (salary sole income and bonuses)': 1,
      'Wealth from inheritance': 3,
      'Family income, Trust Fund or Funds from investments': 6,
      'Other': 8,
    }
  },
  {
    title: 'Select source of found',
    key: 'selectSourceOfFund',
    type: 'individual',
    answers: {
      'Retired (receiving state or occupational pension)': 1,
      'Retired living off accumulated wealth': 2,
      'Salaried Employee (salary sole income and bonuses)': 1,
      'Income from real estate sales': 3,
      'Income from real estate rentals': 5,
      'Income from dividend': 2,
      'Funds from investments': 2,
      'Gift': 8,
      'Other': 8,
    }
  },
  {
    title: 'Screening PEP, AML Hit',
    key: 'screenPEPAMLHit',
    type: 'individual',
    answers: {
      Manual: 0
    }
  },
  {
    title: 'Residency',
    key: 'residency',
    type: 'individual',
    answers: {
      Manual: 0
    }
  },
  {
    title: 'Transactional',
    key: 'transactional',
    type: 'individual',
    answers: {
      Manual: 0
    }
  },

  {
    title: 'Type of company',
    key: 'typeOfCompany',
    type: 'business',
    answers: {
      'LLC (Limited Liability Company)': 2,
      'Inc. (Corporation)': 4,
      'LLP (Limited Liability Partnership)': 3,
      'Sole Proprietorship (Single owner)': 1,
      'Partnership': 4,
      'Non-Profit': 8,
    }
  },
  {
    title: 'Business Activity',
    key: 'businessActivity',
    type: 'business',
    answers: {
      'eCommerce': 6,
      'Pharmaceutical (Sales of Drugs).': 6,
      'Fintech': 9,
      'Retail Store': 4,
      'Family Office': 8,
      'Accommodation and Food Services (Hotels, Caterers, Restaurants).': 6,
      'Manufacturing': 4,
      'Educational Services': 1,
      'Arts, Entertainment, and Recreation (Amusements and recreation industries, Theatre companies, Dance companies, Museums, Sports Teams and Clubs)': 8,
      'Wholesale': 8,
      'Adult entertainment (Night Clubs, Videos, Pornography)': 30,
      'Construction': 4,
      'Gaming (Casino, Online Betting, Gambling platform)': 9,
      'Marijuana (Farming or Selling)': 8,
      'Pawn Shops': 8,
      'Professional Services (Offices of Lawyers, Notaries, other independent legal professionals and accountants, Trust and Company Service Providers)': 3,
      'Tabacco': 9,
      'Utilities (Electric power generation, transmission and distribution, Sewage treatment facilities, Water supply and irrigation systems, Natural gas distribution).': 4,
      'Firearms and Weapons': 30,
      'Real Estate (Rental and Leasing)': 8,
      'Management of Companies.': 0, //
      'Other': 0,
    }
  },
  {
    title: 'Purpose of Opening the account',
    key: 'purposeOfOpeningTheA',
    type: 'business',
    answers: {
      'I need account to pay and get payments': 1,
      'I want to store, send, receive and exchange cryptos': 5,
      'I need debit cards for my business expenses': 3,
      'I would like to accept payments in cards (merchant only)': 0, ///
      'Other': 8,
    }
  },
  {
    title: 'Estimated Monthly Volume',
    key: 'estimatedMonthlyVolu',
    type: 'business',
    answers: {
      '0-$100,000': 1,
      '$100,000-$250,000': 2,
      '$250,000-$500,000': 5,
      '$500,000-$1,000,000': 8,
      '$1,000,000-$5,000,000': 10,
      '$5,000,000-$10,000,000': 10,
      '$10,000,000+': 10,
    }
  },
  {
    title: 'Source of Funds',
    key: 'sourceOfFunds',
    type: 'business',
    answers: {
      'Equity Share Capital': 2,
      'Owner Funds': 2,
      'Borrowed Funds': 5,
      'Retained Earnings': 2,
      'Bonds and dividends (Trade Credit)': 2,
      'Gift': 8,
      'Other': 9,
    }
  },
  {
    title: 'Source of Wealth',
    key: 'sourceOfWealth',
    type: 'business',
    answers: {
      'Equity Share Capital': 2,
      'Owner Funds': 4,
      'Borrowed Funds': 4,
      'Retained Earnings': 2,
      'Bonds and Dividends (Trade Credit)': 2,
      'Other': 8,
    }
  },
  {
    title: 'Screening PEP, AML Hit',
    key: 'screenPEPAMLHit',
    type: 'business',
    answers: {
      Manual: 0
    }
  },
  {
    title: 'Residency',
    key: 'residency',
    type: 'business',
    answers: {
      Manual: 0
    }
  },
  {
    title: 'Transactional',
    key: 'transactional',
    type: 'business',
    answers: {
      Manual: 0
    }
  },
];

export async function doImport(models : any) {
  
  const { Questions, Answers } = models;

  if(!Questions || !Answers) {
    return;
  }

  for (const question of questions) {
    const createdQuestion = await Questions.create({
      title: question.title,
      key: question.key,
      type: question.type
    })

    if(!createdQuestion) {
      continue;
    }

    const answersArray = Object.keys(question.answers).map((key: string) => ({
      key,
      title: key,
      score: 0,
      questionId: createdQuestion.id,
      type: question.type
    }));

    await Answers.bulkCreate(answersArray)
  }

}
