require('dotenv').config();
const { Automation, AutomationAction, Subscriber } = require('./src/models');
const automationService = require('./src/services/automationService');

async function testAdvancedAutomation() {
  const orgId = 'test-org-adv-auto';
  const email = 'abutalhasolanki@gmail.com';

  console.log("Setting up Advanced Automation (Wait + Split)...");

  try {
    // 1. Setup Subscriber (Clean up globally to avoid 'email must be unique')
    await Subscriber.destroy({ where: { email } });
    const subscriber = await Subscriber.create({
      email,
      orgId,
      status: 'active',
      firstName: 'AutoTester'
    });

    // 2. Create Automation
    const auto = await Automation.create({
      orgId,
      name: 'Welcome Series with Branching',
      triggerType: 'subscriber_created'
    });

    // 3. Create Actions
    // Action 1: Send Initial Email
    const action1 = await AutomationAction.create({
      type: 'send_email',
      order: 1,
      automationId: auto.id,
      config: { templateId: 'welcome-1' }
    });

    // Action 2: Wait 5 seconds (for testing)
    const action2 = await AutomationAction.create({
      type: 'wait',
      order: 2,
      automationId: auto.id,
      config: { seconds: 5 }
    });

    // Action 3: Split (Check if has tag 'VIP')
    const action3 = await AutomationAction.create({
      type: 'split',
      order: 3,
      automationId: auto.id,
      config: { type: 'has_tag', tagName: 'VIP' }
    });

    // Action 4: VIP Path (Add tag 'High-Priority')
    const action4 = await AutomationAction.create({
      type: 'add_tag',
      order: 4,
      automationId: auto.id,
      config: { tagName: 'High-Priority' }
    });

    // Action 5: Standard Path (Add tag 'Standard-Priority')
    const action5 = await AutomationAction.create({
      type: 'add_tag',
      order: 5,
      automationId: auto.id,
      config: { tagName: 'Standard-Priority' }
    });

    // Linking logic
    await action1.update({ nextActionId: action2.id });
    await action2.update({ nextActionId: action3.id });
    await action3.update({ nextActionId: action4.id, falseActionId: action5.id });

    console.log("✅ Automation Workflow created!");

    // 4. Trigger
    console.log("Triggering automation...");
    await automationService.trigger(orgId, 'subscriber_created', {
        subscriberId: subscriber.id
    });

    console.log("✅ Automation triggered! Engine is processing in background...");

  } catch (error) {
    console.error("❌ Automation Test Failed:", error.message);
    if (error.errors) {
        console.error("Validation Details:", error.errors.map(e => e.message));
    }
  } finally {
    process.exit();
  }
}

testAdvancedAutomation();
