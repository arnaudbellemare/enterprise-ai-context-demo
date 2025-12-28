// Test AI Email Classification & Response
const emailText = `To whom it may concern,

I am the owner of unit 1805 of Enticy. The air conditioner had not worked for a period of time. It just was fixed. Please see below attached invoice. I would like to confirm according to building administration, this expense should be paid by building administration, share or fully paid by us.

I am looking forward to your response and provide me explanation. Thank you.

Regards,
Yong Hong Shi
Owner of #1805, Enticy`;

console.log('🤖 AI Email Processor - DEMO\n');
console.log('📧 INCOMING EMAIL:\n');
console.log(emailText);
console.log('\n' + '='.repeat(60) + '\n');

console.log('🧠 AI CLASSIFICATION:');
console.log('   Template: "Maintenance Cost Inquiry - Private Unit"');
console.log('   Confidence: 94%');
console.log('   Category: Financial/Maintenance');
console.log('\n📝 EXTRACTED ENTITIES:');
console.log('   • Unit: #1805');
console.log('   • Building: Enticy');
console.log('   • Issue: Air conditioner repair');
console.log('   • Owner: Yong Hong Shi');
console.log('   • Question: Who pays for repair?');
console.log('\n✍️  AI-GENERATED RESPONSE:\n');

const aiResponse = `Dear Mr. Shi,

Thank you for your inquiry regarding the air conditioner repair costs for unit #1805 at Enticy.

According to the building's Declaration of Co-ownership, repairs and maintenance of equipment that exclusively serves an individual private unit are the financial responsibility of the unit owner.

Since the air conditioner in question serves only your unit #1805 and the repair was confined to equipment within your private space, this expense falls under your responsibility as the co-owner.

Relevant Declaration Extract:
"Maintenance, repair, and replacement of equipment serving exclusively a private portion shall be at the cost and charge of the co-owner of that private portion."

Please retain the invoice for your records. If you require a copy of the relevant Declaration sections or have additional questions, please don't hesitate to contact us.

Best regards,
Gestion Velora
info@gestionvelora.com`;

console.log(aiResponse);
console.log('\n' + '='.repeat(60));
console.log('\n✅ READY TO SEND - Awaiting your approval\n');
console.log('This is exactly what your AI will do automatically! 🚀');
