/**
 * TreeAI Alex SDK - Usage Examples
 * Complete examples for integrating Alex across your TreeAI projects
 */

const { TreeAIAlex } = require('./treeai-alex-sdk');

// =========================================================================
// BASIC SETUP
// =========================================================================

// Initialize Alex for your project
const alex = new TreeAIAlex({
  projectName: 'DroneTreeAI',
  sessionId: 'drone-session-123',
  timeout: 30000
});

// =========================================================================
// EXAMPLE 1: BASIC TREESHOP OPERATIONS
// =========================================================================

async function basicTreeShopExample() {
  console.log('=== Basic TreeShop Operations ===\n');

  try {
    // Create a new lead
    const leadResponse = await alex.createLead('Sarah Johnson at 456 Maple Street, phone (555) 123-4567');
    console.log('Lead Created:', leadResponse.getText());
    
    // Calculate TreeScore
    const treeScore = await alex.calculateTreeScore({
      height: 45,
      crownRadius: 8,
      dbh: 24,
      species: 'oak'
    });
    console.log('\nTreeScore:', treeScore.getText());
    console.log('Extracted Numbers:', treeScore.extractNumbers());

    // Generate proposal
    const proposal = await alex.generateProposal({
      customer: 'Sarah Johnson',
      treeScore: 1440,
      location: '456 Maple Street',
      services: ['tree removal', 'stump grinding']
    });
    console.log('\nProposal:', proposal.getText());

    // Get analytics
    const analytics = await alex.getAnalytics('month');
    console.log('\nAnalytics:', analytics.getText());

  } catch (error) {
    console.error('Basic example failed:', error.message);
  }
}

// =========================================================================
// EXAMPLE 2: DRONE SURVEY INTEGRATION
// =========================================================================

async function droneIntegrationExample() {
  console.log('\n=== Drone Survey Integration ===\n');

  // Initialize Alex for drone project
  const droneAlex = new TreeAIAlex({
    projectName: 'DroneTreeSurvey',
    sessionId: 'drone-survey-456'
  });

  try {
    // Analyze drone survey results
    const droneAnalysis = await droneAlex.analyzeDroneSurvey({
      treeCount: 47,
      averageHeight: 32,
      riskTrees: 8,
      coordinates: '40.7128,-74.0060'
    });
    
    console.log('Drone Analysis:', droneAnalysis.getText());
    console.log('Intent:', droneAnalysis.getIntent());
    console.log('Confidence:', droneAnalysis.getConfidence());

    // Follow up with specific questions
    const followUp = await droneAlex.chat('What crew size is recommended for the high-risk trees?');
    console.log('\nFollow-up:', followUp.getText());

    // Risk assessment based on drone data
    const riskAssessment = await droneAlex.assessRisk({
      location: 'Central Park Section B',
      treeData: { highRisk: 8, medium: 15, low: 24 },
      environmentalFactors: 'high wind area, near playground',
      accessChallenges: 'limited vehicle access, pedestrian area'
    });
    
    console.log('\nRisk Assessment:', riskAssessment.getText());

  } catch (error) {
    console.error('Drone example failed:', error.message);
  }
}

// =========================================================================
// EXAMPLE 3: ISA CERTIFICATION PLATFORM
// =========================================================================

async function isaIntegrationExample() {
  console.log('\n=== ISA Certification Integration ===\n');

  const isaAlex = new TreeAIAlex({
    projectName: 'ISACertificationPlatform',
    sessionId: 'isa-student-789'
  });

  try {
    // Assess student performance
    const studentAssessment = await isaAlex.assessISAStudent({
      studentId: 'STU-001',
      answers: {
        question1: 'Pruning cuts should be made just outside the branch collar',
        question2: 'ANSI A300 standards',
        question3: 'Safety glasses, hard hat, chainsaw chaps'
      },
      practicalScore: 87,
      topic: 'Tree Pruning Techniques'
    });

    console.log('Student Assessment:', studentAssessment.getText());

    // Generate personalized feedback
    const feedback = await isaAlex.chat('Provide specific improvement areas for this student');
    console.log('\nPersonalized Feedback:', feedback.getText());

    // Check if student needs additional practice
    if (feedback.contains('improvement') || feedback.contains('practice')) {
      const additionalResources = await isaAlex.chat('Recommend specific practice exercises');
      console.log('\nAdditional Resources:', additionalResources.getText());
    }

  } catch (error) {
    console.error('ISA example failed:', error.message);
  }
}

// =========================================================================
// EXAMPLE 4: EQUIPMENT MANAGEMENT SYSTEM
// =========================================================================

async function equipmentManagementExample() {
  console.log('\n=== Equipment Management Integration ===\n');

  const equipAlex = new TreeAIAlex({
    projectName: 'TreeAIEquipment',
    sessionId: 'equipment-mgmt-101'
  });

  try {
    // Predict maintenance needs
    const maintenance = await equipAlex.predictMaintenance({
      equipmentId: 'CHIP-001',
      hoursUsed: 247,
      lastService: '2024-06-15',
      model: 'Bandit BC-600'
    });

    console.log('Maintenance Prediction:', maintenance.getText());

    // Cost analysis
    const costAnalysis = await equipAlex.chat('Calculate ROI for replacing vs maintaining this chipper');
    console.log('\nCost Analysis:', costAnalysis.getText());

    // Inventory optimization
    const inventory = await equipAlex.chat('Optimize equipment inventory for 3-crew operation');
    console.log('\nInventory Optimization:', inventory.getText());

  } catch (error) {
    console.error('Equipment example failed:', error.message);
  }
}

// =========================================================================
// EXAMPLE 5: ERROR HANDLING AND UTILITIES
// =========================================================================

async function utilityExample() {
  console.log('\n=== Utilities and Error Handling ===\n');

  try {
    // Health check
    const isHealthy = await alex.healthCheck();
    console.log('Alex Health Status:', isHealthy ? '✅ Online' : '❌ Offline');

    // Get conversation history
    const history = await alex.getHistory();
    console.log('Conversation History Length:', history.length);

    // Reset session for fresh start
    const newSessionId = alex.resetSession();
    console.log('New Session ID:', newSessionId);

    // Handle ambiguous responses
    const ambiguousResponse = await alex.chat('yes');
    if (ambiguousResponse.needsMoreInfo()) {
      console.log('Alex needs clarification:', ambiguousResponse.getText());
    }

  } catch (error) {
    console.error('Utility example failed:', error.message);
    
    if (error.name === 'AlexError') {
      console.error('Original error:', error.originalError?.message);
    }
  }
}

// =========================================================================
// EXAMPLE 6: ADVANCED WORKFLOW - COMPLETE PROJECT
// =========================================================================

async function completeProjectWorkflow() {
  console.log('\n=== Complete Project Workflow ===\n');

  const projectAlex = new TreeAIAlex({
    projectName: 'CompleteTreeProject',
    sessionId: 'project-workflow-202'
  });

  try {
    console.log('🏁 Starting complete project workflow...\n');

    // 1. Create lead from drone survey
    const lead = await projectAlex.createLead('Pine Valley HOA - 15 trees identified in drone survey');
    console.log('1. Lead Created:', lead.getEntities().name || 'Pine Valley HOA');

    // 2. Analyze drone data
    const analysis = await projectAlex.analyzeDroneSurvey({
      treeCount: 15,
      averageHeight: 28,
      riskTrees: 3,
      coordinates: '40.7580,-73.9855'
    });
    console.log('2. Drone Analysis Complete');

    // 3. Calculate TreeScore for high-risk trees
    const treeScore = await projectAlex.calculateTreeScore({
      height: 35,
      crownRadius: 12,
      dbh: 18
    });
    console.log('3. TreeScore Calculated:', treeScore.extractNumbers()[0]);

    // 4. Generate comprehensive proposal
    const proposal = await projectAlex.generateProposal({
      customer: 'Pine Valley HOA',
      location: 'Pine Valley Community',
      services: ['tree removal', 'pruning', 'risk assessment']
    });
    console.log('4. Proposal Generated');

    // 5. Schedule work based on proposal
    const workOrder = await projectAlex.scheduleWork({
      customer: 'Pine Valley HOA',
      date: 'Next Tuesday',
      services: 'tree removal and pruning',
      crewSize: 4
    });
    console.log('5. Work Order Scheduled');

    // 6. Process final invoice
    const invoice = await projectAlex.createInvoice({
      customer: 'Pine Valley HOA',
      amount: 4500,
      description: 'Tree removal and pruning services'
    });
    console.log('6. Invoice Created');

    console.log('\n✅ Complete project workflow finished successfully!');

  } catch (error) {
    console.error('❌ Workflow failed:', error.message);
  }
}

// =========================================================================
// RUN EXAMPLES
// =========================================================================

async function runAllExamples() {
  console.log('🚀 TreeAI Alex SDK Examples\n');
  console.log('Testing integration patterns for TreeAI projects...\n');

  await basicTreeShopExample();
  await droneIntegrationExample();
  await isaIntegrationExample();
  await equipmentManagementExample();
  await utilityExample();
  await completeProjectWorkflow();

  console.log('\n🎉 All examples completed!');
  console.log('\nReady to integrate Alex into your TreeAI projects!');
}

// Export examples for testing
module.exports = {
  basicTreeShopExample,
  droneIntegrationExample,
  isaIntegrationExample,
  equipmentManagementExample,
  utilityExample,
  completeProjectWorkflow,
  runAllExamples
};

// Run examples if called directly
if (require.main === module) {
  runAllExamples();
}