/**
 * Test script to verify API data retrieval
 * Run: node test-apis.js
 */

const axios = require('axios');

const OPENALEX_URL = 'https://api.openalex.org/works';
const PUBMED_SEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const PUBMED_FETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
const CLINICAL_TRIALS_URL = 'https://clinicaltrials.gov/api/v2/studies';

async function testOpenAlex() {
  console.log('\n=== Testing OpenAlex API ===');
  try {
    const response = await axios.get(OPENALEX_URL, {
      params: {
        search: 'diabetes treatment',
        per_page: 5,
        sort: 'cited_by_count:desc',
        select: 'id,title,abstract_inverted_index,publication_year,cited_by_count',
      },
      timeout: 10000,
    });

    console.log(`✅ OpenAlex: Found ${response.data.results.length} papers`);
    response.data.results.slice(0, 2).forEach((paper, i) => {
      console.log(`  ${i + 1}. ${paper.title}`);
      console.log(`     Year: ${paper.publication_year}, Citations: ${paper.cited_by_count}`);
    });
  } catch (error) {
    console.error(`❌ OpenAlex Error: ${error.message}`);
  }
}

async function testPubMed() {
  console.log('\n=== Testing PubMed API ===');
  try {
    // Step 1: Search
    const searchResponse = await axios.get(PUBMED_SEARCH_URL, {
      params: {
        db: 'pubmed',
        term: 'diabetes treatment',
        retmax: 5,
        rettype: 'json',
        sort: 'relevance',
      },
      timeout: 10000,
    });

    const pmids = searchResponse.data.esearchresult?.idlist || [];
    console.log(`✅ PubMed Search: Found ${pmids.length} papers`);

    if (pmids.length > 0) {
      // Step 2: Fetch details
      const fetchResponse = await axios.get(PUBMED_FETCH_URL, {
        params: {
          db: 'pubmed',
          id: pmids.slice(0, 3).join(','),
          rettype: 'abstract',
          retmode: 'json',
        },
        timeout: 15000,
      });

      const papers = fetchResponse.data.result?.uids || [];
      console.log(`✅ PubMed Fetch: Retrieved ${papers.length} paper details`);
      papers.slice(0, 2).forEach((uid) => {
        const paper = fetchResponse.data.result[uid];
        console.log(`  - ${paper.title}`);
        console.log(`    Year: ${paper.pubdate?.split(' ')[0]}`);
        console.log(`    Abstract: ${paper.abstract?.substring(0, 100)}...`);
      });
    }
  } catch (error) {
    console.error(`❌ PubMed Error: ${error.message}`);
  }
}

async function testClinicalTrials() {
  console.log('\n=== Testing ClinicalTrials.gov API ===');
  try {
    const response = await axios.post(CLINICAL_TRIALS_URL, {
      query: {
        condition: ['diabetes'],
        status: ['RECRUITING', 'ACTIVE_NOT_RECRUITING'],
      },
      pageSize: 5,
    }, {
      timeout: 15000,
    });

    console.log(`✅ ClinicalTrials: Found ${response.data.studies.length} trials`);
    response.data.studies.slice(0, 2).forEach((study, i) => {
      const id = study.protocolSection?.identificationModule?.nctId;
      const title = study.protocolSection?.identificationModule?.briefTitle;
      const status = study.protocolSection?.statusModule?.overallStatus;
      console.log(`  ${i + 1}. ${title}`);
      console.log(`     ID: ${id}, Status: ${status}`);
    });
  } catch (error) {
    console.error(`❌ ClinicalTrials Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🔬 Testing Medical Research APIs...');
  console.log('================================');

  await testOpenAlex();
  await testPubMed();
  await testClinicalTrials();

  console.log('\n================================');
  console.log('✅ API Tests Complete');
}

runTests().catch(console.error);
