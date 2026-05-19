
// ═══ CONFIG ═══════════════════════════════════════════════
const SHEET_URL='https://script.google.com/macros/s/AKfycbzgOEE1ANt7dVynnOkeyMIuzwRgggFPrrngPMAOqXLkSBOM2udGN1rbtelWEDYFxGMI/exec';
const FCS_SECS=15*60, BEHAV_SECS=25*60;
const PARAMS=new URLSearchParams(window.location.search);
const TRAINER=PARAMS.get('trainer')||'';
const CENTRE=PARAMS.get('centre')||'';
const CLIENT=PARAMS.get('client')||'';
const BATCH=PARAMS.get('batch')||'';
const DIAMOND_TYPE=PARAMS.get('diamonds')||'natural';
const ALLOW_RESET=PARAMS.get('reset')==='true';

// Pre-fill
if(BATCH) document.getElementById('fbatch').value=BATCH;
if(CENTRE) document.getElementById('fcentre').value=CENTRE;
document.getElementById('fdiamondtype').value=DIAMOND_TYPE;

// Trainer badge
(function(){
  const parts=[];
  if(CLIENT) parts.push('Client: '+CLIENT);
  if(CENTRE) parts.push('Centre: '+CENTRE);
  if(TRAINER) parts.push('Trainer: '+TRAINER);
  if(BATCH) parts.push('Batch: '+BATCH);
  if(parts.length) document.getElementById('trainerBadge').textContent=parts.join(' \\u25C6 ');
  // Diamond type indicator
  const dtLabels={natural:'Natural Diamonds',lgd:'Lab Grown Diamonds',both:'Natural & Lab Grown Diamonds'};
  const dtColors={natural:'#1D9E75',lgd:'#534AB7',both:'#C9A84C'};
  const lbl=dtLabels[DIAMOND_TYPE]||'Natural Diamonds';
  const col=dtColors[DIAMOND_TYPE]||'#1D9E75';
  const ind=document.getElementById('diamondIndicator');
  ind.style.cssText='display:flex;align-items:center;gap:10px;padding:10px 14px;background:#F4F1EB;border-radius:8px;margin-bottom:14px;border:1px solid '+col+'33';
  ind.innerHTML='<div style="width:8px;height:8px;border-radius:50%;background:'+col+';flex-shrink:0"></div><div style="font-size:13px;color:#0D1B2E"><span style="font-weight:500">Diamond Knowledge section:</span> <span style="color:'+col+';font-weight:600">'+lbl+'</span></div>';
})();

// ═══ DATA ════════════════════════════════════════════════
const RSP_DISPLAY={};
const C2S_NAMES={"1": "Analytical", "2": "Amiable", "3": "Expressive", "4": "Driver"};
const C2S_COLORS={"1": "#378ADD", "2": "#1D9E75", "3": "#D85A30", "4": "#534AB7"};
const MATRIX={};
const C2S_BLEND={"1-3": "Your Analytical-Expressive blend is rare \u2014 you think in facts but communicate with energy. The tension between needing precision and wanting connection is actually your greatest asset on the floor. Learn to sequence them: logic first to build your own confidence, emotion second to bring the customer with you.", "1-2": "Your Analytical-Amiable blend means you are both careful and kind. You rarely rush customers and you rarely get things wrong. The gap is initiating \u2014 both styles tend to wait. Your development goal is learning to lead the conversation forward once you have all the information you need.", "1-4": "Your Analytical-Driver blend makes you highly effective and efficient. You know what you are talking about and you move with purpose. Watch that you do not bypass the emotional layer entirely \u2014 customers often need to feel understood before they will accept even the most accurate recommendation.", "2-3": "Your Expressive-Amiable blend creates a naturally warm and engaging presence. People enjoy being around you and feel welcomed. The risk is that your energy can soften into social conversation that does not convert. Channel your expressiveness with a clear destination in mind.", "3-4": "Your Expressive-Driver blend is high-octane \u2014 you generate excitement and you close. The risk is that you run past Analytical and Amiable customers who need more time. The most powerful thing you can do is pause, ask one deep question, and genuinely wait for the full answer.", "2-4": "Your Amiable-Driver blend is unusual and valuable \u2014 you are both warm and decisive. You get things done without being cold about it. The tension is that under pressure your Driver side can dominate and the warmth that made the customer trust you disappears. Protecting that warmth under pressure is your key development goal."};
const RSP_BLEND={};
const FCS_SHARED_TAGS=["carat", "carat", "color", "color", "clarity", "clarity", "clarity", "cut", "cut", "clarity", "general", "clarity", "cut", "color", "cut"];
const FCS_NATURAL_TAGS=["general", "general", "general", "general", "general", "clarity", "general", "color", "general", "general"];
const FCS_LGD_TAGS=["general", "general", "general", "general", "general", "general", "general", "general", "general", "general"];


const RSP_Q = [{"q": "A new customer walks in and starts browsing. What do you do first?", "opts": [{"t": "Approach immediately and start telling them about your best sellers and current offers", "s": 1.0}, {"t": "Greet them, mention a promotion, and stay close in case they need help", "s": 1.5}, {"t": "Welcome them warmly, give them a moment, then ask what occasion brings them in", "s": 2.0}, {"t": "Observe their browsing carefully, then open with a question tailored to what caught their eye", "s": 2.5}, {"t": "Create a warm welcome, read their energy and body language, and open a genuine conversation about them \u2014 not the product", "s": 3.0}]}, {"q": "A customer picks up a piece and asks 'how much is this?' What is your response?", "opts": [{"t": "Tell them the price and quickly highlight the discount or offer available", "s": 1.0}, {"t": "Give the price and mention it is good value for the quality", "s": 1.5}, {"t": "Ask what they are looking for before discussing price, so you can show them the best options in their range", "s": 2.0}, {"t": "Acknowledge the price, then ask about the occasion so you can explain why this piece is worth considering", "s": 2.5}, {"t": "Connect the price to the story of the piece \u2014 its quality, craftsmanship, and what it will mean to the person who receives it", "s": 3.0}]}, {"q": "A customer says 'I need to think about it.' How do you respond?", "opts": [{"t": "Tell them stock is limited and they risk losing it if they wait", "s": 1.0}, {"t": "Ask if price is the concern and offer to check if anything can be done", "s": 1.5}, {"t": "Ask what specifically they need to think about \u2014 you might be able to help them decide today", "s": 2.0}, {"t": "Acknowledge their need to reflect, summarise what they loved about the piece, and offer to hold it briefly", "s": 2.5}, {"t": "Ask a gentle question to understand what is unresolved for them \u2014 and help them reach clarity rather than pushing for an answer", "s": 3.0}]}, {"q": "A customer mentions a budget significantly lower than what you are showing them. You:", "opts": [{"t": "Show them only what is within their budget and close quickly", "s": 1.0}, {"t": "Show budget options but mention they could get something nicer with a small stretch", "s": 1.5}, {"t": "Ask about the occasion first \u2014 then show options that balance their budget with what the moment deserves", "s": 2.0}, {"t": "Explore whether the budget is fixed or flexible, and help them understand what the difference in price actually delivers in quality", "s": 2.5}, {"t": "Treat the budget as information, not a ceiling \u2014 help them make a decision they will feel proud of, whether that means within or beyond their original number", "s": 3.0}]}, {"q": "A customer asks you to compare your diamond with a competitor's lower-priced option. You:", "opts": [{"t": "Tell them your price is fixed and your quality is better without going into detail", "s": 1.0}, {"t": "Point out the visible differences in the pieces and say yours is worth the premium", "s": 1.5}, {"t": "Explain the specific quality differences \u2014 cut grade, certification, clarity \u2014 that justify the price", "s": 2.0}, {"t": "Walk them through an objective comparison and help them understand exactly what they are getting and giving up at each price point", "s": 2.5}, {"t": "Acknowledge the competitor honestly, explain the differences with expertise, and let the customer reach their own conclusion \u2014 trusting that transparency builds more loyalty than pressure", "s": 3.0}]}, {"q": "A customer has a complaint about a purchase they made last week. Your first action is:", "opts": [{"t": "Explain the store policy and what can and cannot be done", "s": 1.0}, {"t": "Apologise and offer the standard resolution \u2014 exchange or credit note", "s": 1.5}, {"t": "Listen fully to understand exactly what went wrong before offering any solution", "s": 2.0}, {"t": "Make them feel genuinely heard, take ownership of their experience, and create a solution that goes beyond the minimum", "s": 2.5}, {"t": "Treat the complaint as a trust-building opportunity \u2014 resolve it generously, follow up personally, and turn the dissatisfied customer into your most loyal advocate", "s": 3.0}]}, {"q": "After a successful sale, what do you typically do?", "opts": [{"t": "Thank them and move on to the next customer", "s": 1.0}, {"t": "Pack the purchase nicely and mention they can come back anytime", "s": 1.5}, {"t": "Note their details and follow up in a few days to make sure they are happy", "s": 2.0}, {"t": "Send a personal follow-up, note the occasion, and set a reminder for the next relevant moment \u2014 anniversary, birthday, festival", "s": 2.5}, {"t": "Begin a genuine ongoing relationship \u2014 the sale is the start, not the end. You invest in understanding their life moments and become their go-to person for every jewellery occasion", "s": 3.0}]}, {"q": "A customer is buying an engagement ring but seems overwhelmed by the options. You:", "opts": [{"t": "Show them your top three sellers and recommend the most popular one", "s": 1.0}, {"t": "Narrow the options down based on their budget and show the best in that range", "s": 1.5}, {"t": "Ask questions about their partner's style and the story behind the proposal to guide the choice", "s": 2.0}, {"t": "Help them visualise what their partner would feel receiving each option \u2014 making the decision emotional and meaningful, not just visual", "s": 2.5}, {"t": "Slow the whole experience down \u2014 understand the relationship, the moment, the meaning \u2014 and co-create the choice with the customer so they feel deep conviction, not just decision", "s": 3.0}]}, {"q": "A loyal customer visits but says they are just browsing today. You:", "opts": [{"t": "Show them the latest arrivals and try to find something they might buy", "s": 1.0}, {"t": "Welcome them and let them know about any promotions currently running", "s": 1.5}, {"t": "Have a genuine conversation, find out what is happening in their life, and stay in touch with what they might need next", "s": 2.0}, {"t": "Use the visit to deepen the relationship \u2014 remember what they bought before, ask about the occasion it was for, and show them something that connects to their taste", "s": 2.5}, {"t": "Value the visit entirely for the relationship \u2014 no agenda to sell today. The trust built in a no-pressure visit is worth more than any transaction", "s": 3.0}]}, {"q": "A mother and daughter come in together to buy a gift but clearly disagree on what they want. You:", "opts": [{"t": "Show options that are in the middle and suggest a compromise price point", "s": 1.0}, {"t": "Focus on the decision-maker \u2014 usually the one paying \u2014 and guide them to a choice", "s": 1.5}, {"t": "Ask each of them what matters most and find a piece that genuinely bridges both their preferences", "s": 2.0}, {"t": "Facilitate the conversation between them \u2014 help each feel heard, and guide them to a shared decision they both feel good about", "s": 2.5}, {"t": "Recognise this as a relationship moment as much as a purchase decision \u2014 help them enjoy the process together, and find a piece that becomes a shared memory for both of them", "s": 3.0}]}, {"q": "A customer asks a detailed technical question about diamond quality that you are not 100% sure about. You:", "opts": [{"t": "Give your best answer confidently \u2014 appearing knowledgeable is important", "s": 1.0}, {"t": "Give what you know and move the conversation toward making a decision", "s": 1.5}, {"t": "Tell them you want to give them accurate information and check with a colleague or the certificate", "s": 2.0}, {"t": "Be transparent about the limit of your current knowledge, look it up together, and use it as an opportunity to educate both of you", "s": 2.5}, {"t": "Model intellectual honesty \u2014 'That is a great question and I want to get it exactly right for you' \u2014 then verify, answer fully, and use the moment to build deep credibility through transparency", "s": 3.0}]}, {"q": "You have a high daily sales target and the store is busy. How does this affect how you work with each customer?", "opts": [{"t": "You focus on high-value customers and try to close quickly to hit numbers", "s": 1.0}, {"t": "You stay professional but keep interactions efficient to serve as many customers as possible", "s": 1.5}, {"t": "You maintain your quality of service but are more focused about moving toward decisions", "s": 2.0}, {"t": "You trust that excellent service always delivers better numbers \u2014 and you protect the quality of each interaction even under pressure", "s": 2.5}, {"t": "Targets are context, not the purpose. You give every customer the full quality of your attention regardless of pressure \u2014 and the results consistently follow", "s": 3.0}]}, {"q": "How do you typically prepare for a high-value returning customer visit?", "opts": [{"t": "Make sure you have the latest offers and promotions ready to present", "s": 1.0}, {"t": "Review what they bought before and have similar options ready", "s": 1.5}, {"t": "Review their purchase history, note upcoming occasions, and plan two or three relevant suggestions", "s": 2.0}, {"t": "Research their preferences in depth, prepare personalised options, and think about what life moment they might be approaching", "s": 2.5}, {"t": "Treat it as a relationship meeting, not a sales call \u2014 know their story, their family, their taste, their past purchases, and their next likely occasion. Walk in ready to serve them as a trusted advisor, not a salesperson", "s": 3.0}]}, {"q": "A customer says 'diamonds are not a good investment, I can get the same on a website for half the price.' You:", "opts": [{"t": "Defend your price and tell them online diamonds are lower quality", "s": 1.0}, {"t": "Acknowledge the price difference and highlight your after-sales service and guarantees", "s": 1.5}, {"t": "Separate the investment question from the purchase question \u2014 help them understand what they are actually buying and why", "s": 2.0}, {"t": "Engage the objection honestly and intellectually \u2014 discuss what online vs in-store actually means for certification, quality assurance, and the experience of buying", "s": 2.5}, {"t": "Welcome the conversation \u2014 a customer who raises this is genuinely thinking. Help them arrive at their own informed conclusion through dialogue rather than persuasion", "s": 3.0}]}, {"q": "What does a great day on the sales floor look like to you?", "opts": [{"t": "Hitting or exceeding your sales target", "s": 1.0}, {"t": "Multiple good transactions and customers who seemed happy", "s": 1.5}, {"t": "Customers who got exactly what they needed and left feeling well-served", "s": 2.0}, {"t": "Deep conversations where you genuinely helped people make meaningful decisions \u2014 and the numbers reflected that", "s": 2.5}, {"t": "Moments where a customer trusted you completely, made a decision they are proud of, and you know they will come back to you and only you for every future purchase", "s": 3.0}]}, {"q": "A junior colleague is struggling to close a sale with a difficult customer. You:", "opts": [{"t": "Step in, take over the sale, and close it yourself", "s": 1.0}, {"t": "Observe and give them a tip afterwards on what they should have done", "s": 1.5}, {"t": "Offer to assist naturally, support the customer together, and debrief with the colleague after", "s": 2.0}, {"t": "Support from the side \u2014 not to take the sale but to help your colleague develop their skill through the live situation", "s": 2.5}, {"t": "See it as a coaching moment \u2014 create a way for your colleague to succeed with your quiet support, so both the customer and the colleague grow in confidence through the interaction", "s": 3.0}]}];
const RSP_STAGES = [{"key": "PP", "label": "Product Pusher", "range": "< 1.25", "min": 0, "max": 1.25, "color": "#8B6553", "icon": "1"}, {"key": "TA", "label": "Transaction Achiever", "range": "1.26\u20131.75", "min": 1.26, "max": 1.75, "color": "#A07060", "icon": "2"}, {"key": "PS", "label": "Problem Solver", "range": "1.76\u20132.25", "min": 1.76, "max": 2.25, "color": "#7A6070", "icon": "3"}, {"key": "EA", "label": "Expert Advisor", "range": "2.26\u20132.75", "min": 2.26, "max": 2.75, "color": "#534AB7", "icon": "4"}, {"key": "TrA", "label": "Trusted Advisor", "range": "2.76+", "min": 2.76, "max": 3.0, "color": "#C9A84C", "icon": "5"}];
const PROFILES_20 = {"Analytical-PP": {"title": "The Knowledgeable Pusher", "body": "You have genuine product knowledge but you deploy it in service of the transaction rather than the customer. You lead with features and facts to persuade rather than to understand. The shift from Product Pusher to Transaction Achiever begins with one habit: ask one question before you share one fact. Every time.", "strengths": ["Strong product knowledge that builds credibility quickly", "Detail-oriented \u2014 customers feel you know what you are talking about", "Efficient and purposeful in every interaction"], "watchouts": ["Uses knowledge to persuade rather than to understand", "Jumps to product before understanding the customer's need", "May feel robotic or transactional to emotionally-driven customers"], "customers": "You work best with Analytical customers who respond to facts. With Expressive and Amiable customers, lead with warmth and the occasion \u2014 save the facts for after they feel understood.", "moment": "You shine when a customer asks detailed comparison questions and needs an expert to cut through the noise.", "next_stage": "Transaction Achiever: Start every interaction with one genuine question about the customer before you mention any product.", "trainerNote": "This associate has knowledge but directs it at the sale, not the customer. Role-play the discipline of asking before telling. The habit to build: one question first, every time.", "focus1": "Ask before you tell", "f1sub": "One question minimum", "focus2": "Connect facts to occasions", "f2sub": "Why does this matter to them?", "idp": [{"area": "Discovery discipline", "gap": "Tells before asking", "action70": "Set a rule: ask one question about the customer or occasion before mentioning any product \u2014 practise in every interaction for 30 days", "action20": "Ask your manager to observe 3 interactions per week \u2014 were you asking or telling first?", "action10": "Study IGI Module 3 \u2014 the questioning framework section"}, {"area": "Emotional connection", "gap": "Facts without feeling", "action70": "After every product fact, immediately connect it to the customer's occasion or emotion", "action20": "Shadow a Trusted Advisor colleague and watch how they link knowledge to meaning", "action10": "Read the Need-Attribute-Meaning-Emotion model in IGI Module 4"}]}, "Analytical-TA": {"title": "The Efficient Analyst", "body": "You are professional, accurate, and consistently get transactions done. Customers feel well-served in a functional sense. The move to Problem Solver requires you to shift from answering the question the customer asks to understanding the question behind the question. What are they really trying to solve?", "strengths": ["Reliable and accurate \u2014 customers trust the information you give them", "Efficient \u2014 interactions have clear purpose and direction", "Handles product comparisons and specifications confidently"], "watchouts": ["Solves the surface request without exploring the deeper need", "Interactions can feel professional but not personal", "May miss emotional buying triggers while focusing on the logical ones"], "customers": "You work well with Analytical and Driver customers who value accuracy and efficiency. Push yourself to slow down with Amiable and Expressive customers.", "moment": "You shine when a customer comes in with a clear brief and needs efficient, accurate guidance.", "next_stage": "Problem Solver: Before answering any question, ask yourself \u2014 what is the real need behind this question?", "trainerNote": "Solid professional performer. Development goal: moving from surface-level service to genuine need discovery. Role-play uncovering the unstated need in every scenario.", "focus1": "The question behind the question", "f1sub": "Dig one level deeper", "focus2": "Occasion-led discovery", "f2sub": "Always ask what it is for", "idp": [{"area": "Need discovery depth", "gap": "Answers surface questions only", "action70": "After every customer question, ask one follow-up question to understand the real need before answering", "action20": "Weekly debrief with manager: what was the real need in today's top 3 interactions?", "action10": "Study IGI Module 3 \u2014 the explicit vs implicit needs debrief from the 25th anniversary scenario"}, {"area": "Emotional reading", "gap": "Logic-focused, misses emotional cues", "action70": "After each interaction, write one sentence about how the customer seemed to feel", "action20": "Ask a colleague to observe 2 of your interactions and give feedback on emotional attunement", "action10": "Study IGI Module 2 \u2014 the 4-quadrant behavioural framework"}]}, "Analytical-PS": {"title": "The Knowledge Consultant", "body": "You are genuinely helpful \u2014 customers leave your interactions better informed and better served than when they arrived. You understand what they need and you address it accurately. The step to Expert Advisor is about depth of relationship, not depth of knowledge. You already know the product. Start knowing the customer.", "strengths": ["Genuinely solves customer problems with accurate, thoughtful guidance", "Trusted for honest and detailed information", "Combines analytical thinking with a service orientation"], "watchouts": ["Deep on product knowledge, less deep on customer knowledge", "May not invest enough in the long-term relationship layer", "Recommendations can feel expert but not personalised"], "customers": "You work best with Analytical and Amiable customers who want accuracy and care. With Driver customers, be more decisive and direct.", "moment": "You shine when a customer has a specific problem \u2014 wrong size, wrong occasion, uncertain about quality \u2014 and needs someone to solve it properly.", "next_stage": "Expert Advisor: Start building a client record for every significant customer \u2014 their story, not just their purchase history.", "trainerNote": "Strong consultant profile. Development goal: deepening from product expertise to customer intimacy. Challenge them to remember and use personal details about customers in every interaction.", "focus1": "Know the customer as well as the product", "f1sub": "Names, occasions, preferences", "focus2": "Proactive recommendation", "f2sub": "Suggest before they ask", "idp": [{"area": "Customer intimacy", "gap": "Knows product deeply, customer less so", "action70": "Start a simple client record: name, what they bought, the occasion, one personal detail \u2014 review before every return visit", "action20": "Review your top 10 client records with your manager monthly", "action10": "Study IGI Module 7 \u2014 the ABCD Trust model and what Intimacy means in the Trusted Advisor context"}, {"area": "Proactive recommendation", "gap": "Responds well but rarely initiates", "action70": "Make one unsolicited recommendation to every returning customer based on what you know about them", "action20": "Role-play proactive recommendations with a colleague weekly", "action10": "Study IGI Module 6 \u2014 the cross-sell and up-sell framework"}]}, "Analytical-EA": {"title": "The Knowledge Authority", "body": "You are one of the most credible associates on the floor. Customers trust your expertise and feel safe in your hands. The final step to Trusted Advisor for you is integration \u2014 using your deep knowledge not to impress but to serve, and building relationships deep enough that customers proactively seek you out by name.", "strengths": ["Unmatched product credibility on the floor", "Customers feel genuinely safe making significant purchases with you", "Combines analytical precision with genuine customer orientation"], "watchouts": ["Can still lean on knowledge when relationship would serve better", "May not ask for referrals or loyalty explicitly enough", "The final step to Trusted Advisor requires emotional depth, not more knowledge"], "customers": "You work brilliantly with Analytical customers and increasingly well with all types. The one to develop: Expressive customers who want story and emotion first.", "moment": "You shine when a customer is making a significant investment and needs absolute confidence in the person guiding them.", "next_stage": "Trusted Advisor: Ask every significant customer for a referral. The Trusted Advisor is known by name. Are you?", "trainerNote": "Near the top of the maturity scale. Development is about emotional depth and relationship investment \u2014 not knowledge. Challenge them on referrals and long-term loyalty building.", "focus1": "Ask for referrals explicitly", "f1sub": "Trust earns introductions", "focus2": "Emotional depth in relationships", "f2sub": "Know their life, not just their taste", "idp": [{"area": "Referral behaviour", "gap": "Trusted but not asking for referrals", "action70": "At the end of every very positive interaction, ask: 'If you know anyone looking for something special, I would love to help them the way I helped you'", "action20": "Track referrals received monthly with your manager", "action10": "Study IGI Module 7 \u2014 the post-purchase engagement and loyalty building section"}, {"area": "Emotional depth", "gap": "Knowledge-led rather than relationship-led", "action70": "In every return visit, open with the personal before the product \u2014 ask about the occasion the last purchase was for", "action20": "Discuss with your manager: which of your clients knows you personally, not just professionally?", "action10": "Study the Trusted Advisor model \u2014 the Intimacy dimension"}]}, "Analytical-TrA": {"title": "The Trusted Authority", "body": "You represent the highest expression of what a jewellery sales professional can be \u2014 deeply knowledgeable, genuinely trusted, and personally connected to your clients. Customers come to you by name, refer their family and friends, and trust your judgement on their most significant purchases. Your development is about scale and mentorship \u2014 how do you elevate the entire team around you?", "strengths": ["Deeply trusted by a loyal client base who return and refer", "Combines world-class product knowledge with genuine relationship depth", "Sets the standard for what professional excellence looks like on the floor"], "watchouts": ["Risk of becoming siloed in your own client base \u2014 share your knowledge", "Junior team members need your mentorship \u2014 are you investing in them?", "Even at this level, stay curious and keep learning"], "customers": "You work effectively with all customer types. Your development is about breadth \u2014 how many different types of customers can you serve at this level?", "moment": "You shine in every customer interaction \u2014 and especially when a first-time customer leaves feeling like a lifetime client.", "next_stage": "You are at the top of the maturity ladder. Your next chapter is mentorship \u2014 helping others climb.", "trainerNote": "This is a master performer. Development goal: knowledge transfer and team mentorship. Consider as a buddy or coach for junior associates. Discuss leadership pathways.", "focus1": "Mentoring junior associates", "f1sub": "Your knowledge multiplied", "focus2": "Continued learning", "f2sub": "Stay curious at the top", "idp": [{"area": "Team mentorship", "gap": "Knowledge concentrated in one person", "action70": "Formally mentor one junior colleague \u2014 weekly 15-minute debrief after their challenging interactions", "action20": "Co-facilitate a role-play session with your manager for the wider team monthly", "action10": "Study leadership coaching frameworks \u2014 IGI Module leadership series"}, {"area": "Continuous learning", "gap": "Risk of plateau at the top", "action70": "Set a learning goal each quarter \u2014 a new product category, a new customer type, a new market", "action20": "Share one new learning with the team each month in a brief knowledge session", "action10": "Read one relevant industry publication per month \u2014 jewellery retail or luxury customer behaviour"}]}, "Amiable-PP": {"title": "The Friendly Pusher", "body": "People like you immediately \u2014 your warmth is a genuine commercial asset. But right now your warmth is in service of the transaction, not the customer's real need. The shift to Transaction Achiever begins with using your natural likability to ask better questions. People will tell you anything \u2014 are you asking?", "strengths": ["Instantly likable \u2014 customers are comfortable with you immediately", "Warm and welcoming environment that reduces purchase anxiety", "High energy and genuine enthusiasm for the product"], "watchouts": ["Warmth used to persuade rather than to understand", "Friendly interactions that do not actually address the customer's need", "May rely on likability rather than building real credibility"], "customers": "You work naturally with Amiable and Expressive customers. Learn to channel your warmth more purposefully with Analytical and Driver customers who need substance alongside the connection.", "moment": "You shine when a nervous or first-time customer needs to feel comfortable \u2014 your warmth removes the intimidation of a high-end jewellery environment.", "next_stage": "Transaction Achiever: Use your warmth to ask \u2014 not to tell. 'Tell me about the occasion' is a warm question that opens everything.", "trainerNote": "Natural warmth is a real asset here. Development goal: directing that warmth into discovery rather than persuasion. Role-play warm discovery questions specifically.", "focus1": "Warm questions, not warm pitches", "f1sub": "Ask with the same energy you sell", "focus2": "From likable to credible", "f2sub": "Knowledge adds substance to warmth", "idp": [{"area": "Warm discovery", "gap": "Warmth in service of pitch, not customer", "action70": "Replace your opening pitch with a warm discovery question \u2014 'Tell me about the occasion' \u2014 in every interaction", "action20": "Observe a colleague who is strong at discovery and note their opening 3 questions", "action10": "Study IGI Module 3 \u2014 the questioning and listening framework"}, {"area": "Product credibility", "gap": "Warmth without knowledge depth", "action70": "Learn one new product fact per week and use it in at least 5 customer interactions", "action20": "Ask your manager to quiz you on 4Cs knowledge monthly", "action10": "Review your 4Cs assessment results and focus study on your lowest category"}]}, "Amiable-TA": {"title": "The Warm Achiever", "body": "You are genuinely pleasant to buy from \u2014 customers feel served rather than sold to. You get transactions done with care. The move to Problem Solver is about going deeper into what the customer actually needs before you serve them. Your warmth already creates safety \u2014 now use that safety to ask harder, more meaningful questions.", "strengths": ["Creates a genuinely pleasant buying experience", "Customers feel cared for, not processed", "Consistent and reliable service that builds repeat visits"], "watchouts": ["Serves the stated need without always exploring the real one", "Interactions are warm but may not be deeply consultative", "May avoid asking challenging questions to keep the atmosphere comfortable"], "customers": "You work best with Amiable customers who mirror your warmth. Challenge yourself to be more structured and questioning with Analytical customers.", "moment": "You shine when a customer needs reassurance and care during a significant purchase decision.", "next_stage": "Problem Solver: Comfortable conversations are good \u2014 but ask the one question that might be slightly uncomfortable. 'What is the real occasion for this?'", "trainerNote": "Warm and reliable. Development goal: using warmth as a bridge to deeper need discovery, not just a pleasant surface. Push them to ask the one uncomfortable question.", "focus1": "The deeper question", "f1sub": "Safety lets you go further", "focus2": "Occasion mapping", "f2sub": "Understand the real moment", "idp": [{"area": "Deep need discovery", "gap": "Warm but surface-level service", "action70": "In every interaction, ask one question beyond the obvious \u2014 about the relationship, the recipient, the meaning of the occasion", "action20": "Weekly debrief with manager: what was the most meaningful thing you learned about a customer today?", "action10": "Study IGI Module 3 \u2014 the Occasion Mapping framework"}, {"area": "Comfortable with challenge", "gap": "Avoids questions that might create friction", "action70": "Practise asking the one slightly challenging question per interaction \u2014 'Is this for a special reason?' \u2014 and see what opens up", "action20": "Role-play with manager: scenarios where the challenging question leads to a better sale", "action10": "Study IGI Module 5 \u2014 the consultative close technique"}]}, "Amiable-PS": {"title": "The Gentle Guide", "body": "You are genuinely helpful and customers feel understood by you. You solve their real problem with care and warmth. The move to Expert Advisor requires you to bring more conviction to your recommendations. You already understand the customer \u2014 now trust yourself enough to say 'This is the one for you' with full confidence.", "strengths": ["Genuinely understands customer needs before recommending", "Warm and consultative \u2014 customers feel guided, not sold to", "Creates lasting positive impressions that bring customers back"], "watchouts": ["Under-recommends out of deference to the customer", "May hedge or offer too many options when one clear recommendation would serve better", "Conviction in the recommendation needs to match the care in the discovery"], "customers": "You work beautifully with Amiable and Expressive customers. With Driver customers, be more direct and decisive after your discovery phase.", "moment": "You shine when an uncertain customer needs someone warm and knowledgeable to help them feel confident about a significant decision.", "next_stage": "Expert Advisor: After your discovery, make one clear recommendation. Not two or three \u2014 one. 'Based on everything you have told me, this is the one.'", "trainerNote": "Excellent discovery and service orientation. Development goal: conviction in the recommendation. Role-play the single clear recommendation repeatedly until it feels natural.", "focus1": "The single clear recommendation", "f1sub": "One choice, fully owned", "focus2": "Conviction without pressure", "f2sub": "Confident is not pushy", "idp": [{"area": "Recommendation conviction", "gap": "Offers options rather than recommendation", "action70": "End every product presentation with a single clear recommendation: 'I think this is the right one for you because...' \u2014 no exceptions", "action20": "Role-play the recommendation moment with manager weekly", "action10": "Study the Trusted Advisor model \u2014 the Self-Orientation dimension and how reducing it increases impact"}, {"area": "Decision facilitation", "gap": "Leaves decision fully to customer", "action70": "After making your recommendation, guide the customer to a decision by summarising what they told you and connecting it to your suggestion", "action20": "Track your recommendation-to-close rate weekly with your manager", "action10": "Study IGI Module 5 \u2014 the consultative close and the assumptive close techniques"}]}, "Amiable-EA": {"title": "The Experience Creator", "body": "You are one of the most loved associates in any store you work in. Customers remember you, return to you, and send their friends to you. You are close to Trusted Advisor. The final step is completing the care cycle consistently \u2014 every warm interaction needs a next step, whether that is a sale, a referral, or a committed return visit.", "strengths": ["Deeply loved and remembered by a loyal client base", "Creates genuinely meaningful and memorable purchase experiences", "Trusted for both expertise and warmth \u2014 a rare combination"], "watchouts": ["May not always convert the warmth of the relationship into a clear outcome", "Referrals and next steps need to be asked for explicitly", "The final step to Trusted Advisor is consistent completion of every interaction"], "customers": "You work well with all customer types. Your warmth adapts naturally. The one to strengthen: explicitly asking for the next step with Driver customers.", "moment": "You shine when a customer is celebrating a life milestone \u2014 an engagement, an anniversary, a significant gift \u2014 and needs someone to make the moment truly special.", "next_stage": "Trusted Advisor: Every great interaction needs a next step. Make it explicit \u2014 a return visit, a referral, a follow-up. Complete the care cycle every time.", "trainerNote": "Near Trusted Advisor. Development goal: the consistent completion habit \u2014 next step in every interaction. Also push for explicit referral requests.", "focus1": "Complete every interaction", "f1sub": "Next step, every time", "focus2": "Ask for referrals", "f2sub": "Warmth earns introductions", "idp": [{"area": "Consistent completion", "gap": "Great interactions without consistent next steps", "action70": "End every significant interaction with an explicit next step \u2014 'I will reach out before your anniversary' or 'Shall we schedule a visit when the new collection arrives?'", "action20": "Review your follow-through rate weekly with manager \u2014 what percentage of warm interactions had a defined next step?", "action10": "Study IGI Module 7 \u2014 the post-purchase engagement framework"}, {"area": "Referral confidence", "gap": "Trusted but not asking for referrals", "action70": "Ask for a referral in every interaction where the customer expresses strong satisfaction", "action20": "Track referrals monthly \u2014 set a target with your manager", "action10": "Study IGI Module 7 \u2014 the ABCD Trust model and how to leverage trust for advocacy"}]}, "Amiable-TrA": {"title": "The Trusted Heart", "body": "You embody what jewellery retail should be \u2014 warm, expert, deeply trusted, and genuinely invested in your clients' most meaningful moments. Customers do not just buy from you; they bring their families, their friends, and their most important occasions to you. You are the standard that your store aspires to.", "strengths": ["Irreplaceable relationships with a loyal and referring client base", "Creates the most memorable purchase experiences on the floor", "The human face of trust and expertise in your store"], "watchouts": ["Your relational skills are rare \u2014 share them through mentoring", "Do not let relationship depth come at the cost of breadth", "Stay current on product knowledge \u2014 your expertise must keep pace with your relationships"], "customers": "You serve all customer types with excellence. Your development is about elevating others to your level.", "moment": "Every interaction is your moment. You make ordinary visits feel special and special occasions feel extraordinary.", "next_stage": "You have reached the highest level of the maturity scale. Your chapter now is legacy \u2014 building the next generation of Trusted Advisors.", "trainerNote": "This is the reference standard. Invest in having this associate mentor others. Consider them for team leader or training support roles.", "focus1": "Mentoring the next generation", "f1sub": "Your warmth multiplied", "focus2": "Staying current", "f2sub": "Knowledge keeps trust fresh", "idp": [{"area": "Mentoring", "gap": "Exceptional skill concentrated in one person", "action70": "Formally mentor one developing colleague \u2014 weekly short debriefs on their customer interactions", "action20": "Lead one role-play session per month for the team", "action10": "Study coaching frameworks \u2014 how to ask questions that develop others rather than giving answers"}, {"area": "Continuous development", "gap": "Risk of complacency at the top", "action70": "Set a quarterly learning challenge \u2014 a new product area, a new customer segment, a new technique", "action20": "Share your learning with the team \u2014 monthly five-minute knowledge share", "action10": "Read one luxury customer behaviour article or case study per month"}]}, "Expressive-PP": {"title": "The Energetic Pusher", "body": "You bring energy and excitement to the floor and customers are drawn to you. Right now that energy is channelled into the pitch \u2014 fast, enthusiastic, transaction-focused. The shift to Transaction Achiever is not about reducing your energy. It is about directing it. Channel your enthusiasm into the customer's story rather than the product's features.", "strengths": ["Magnetic energy that draws customers in naturally", "Infectious enthusiasm for the product", "Creates an exciting and dynamic buying atmosphere"], "watchouts": ["Energy in service of the pitch rather than the customer", "Fast pace can overwhelm quieter customers before they have decided anything", "Enthusiasm for the product can outrun the customer's readiness"], "customers": "You naturally attract Expressive customers who match your energy. Learn to read Analytical and Amiable customers early and drop your pace significantly for them.", "moment": "You shine in a busy, high-energy store environment where your momentum creates a buying atmosphere that benefits the whole floor.", "next_stage": "Transaction Achiever: Before your next pitch, ask one question. Just one. Let the customer's answer direct your energy.", "trainerNote": "High energy is a real asset but currently undirected. Development goal: channelling energy into discovery rather than pitch. Role-play the energetic question \u2014 asking with the same enthusiasm as selling.", "focus1": "Energetic discovery", "f1sub": "Ask with enthusiasm", "focus2": "Pace calibration", "f2sub": "Read before you run", "idp": [{"area": "Discovery energy", "gap": "Energy directed at pitch not customer", "action70": "Before every product presentation, ask one enthusiastic discovery question \u2014 match your natural energy to the question, not the pitch", "action20": "Ask your manager to observe whether you are asking or pitching first in each interaction", "action10": "Study IGI Module 3 \u2014 the questioning framework, focus on open questions"}, {"area": "Pace reading", "gap": "Pace overwhelms quieter customers", "action70": "Before every interaction, spend 5 seconds reading the customer's energy level and consciously match it before saying anything", "action20": "Role-play with a quiet, slow-paced colleague as the customer \u2014 practice the conscious pace drop", "action10": "Study IGI Module 2 \u2014 the Amiable and Analytical quadrants and their buying pace"}]}, "Expressive-TA": {"title": "The Vibrant Achiever", "body": "You get results with personality \u2014 customers enjoy the experience of buying from you. You are consistent and professional. The move to Problem Solver is about depth \u2014 using your natural expressiveness to ask richer questions, not just give richer answers. Your stories are compelling. Make them two-way.", "strengths": ["Creates an enjoyable and memorable buying experience", "Consistently delivers results with authentic personality", "Natural storyteller who makes products come alive"], "watchouts": ["Stories and energy can substitute for deep need discovery", "Interactions are lively but may not always get to the customer's real need", "The expressiveness can make customers feel entertained without feeling fully understood"], "customers": "You work brilliantly with Expressive and Amiable customers. With Analytical customers, bring structure and facts alongside the energy.", "moment": "You shine when a customer needs to be drawn out of indecision by enthusiasm and narrative \u2014 your energy creates momentum.", "next_stage": "Problem Solver: Make your stories two-way. Ask the customer to tell you their story before you tell yours.", "trainerNote": "Engaging performer. Development goal: making expressiveness genuinely two-way \u2014 the customer's story should match the associate's energy and richness.", "focus1": "Two-way storytelling", "f1sub": "Invite their story first", "focus2": "Structured discovery", "f2sub": "Questions with direction", "idp": [{"area": "Two-way conversation", "gap": "Monologue energy rather than dialogue", "action70": "Before telling any story about a product, ask the customer to share the story of the occasion first", "action20": "Record yourself in a role-play and count how many times you spoke vs listened \u2014 aim for 40% speaking", "action10": "Study IGI Module 3 \u2014 the listening framework and active listening techniques"}, {"area": "Need discovery depth", "gap": "Surface discovery before compelling pitch", "action70": "Ask two discovery questions before any product presentation \u2014 write them on a card if needed until it becomes habit", "action20": "Weekly debrief with manager: what did you learn about the customer's real need today?", "action10": "Study IGI Module 3 \u2014 the Occasion Mapping tool"}]}, "Expressive-PS": {"title": "The Storytelling Solver", "body": "You understand customer needs and you bring them alive through narrative. You make product knowledge feel exciting and human. The step to Expert Advisor is about deepening your expertise so your stories are not just engaging but authoritative. Customers should leave not just entertained but convinced that they have been guided by someone who truly knows.", "strengths": ["Combines deep customer understanding with compelling communication", "Makes complex product information feel accessible and exciting", "Genuine problem-solving ability wrapped in engaging delivery"], "watchouts": ["Story can overtake substance \u2014 keep the expertise sharp", "May rely on narrative when technical depth would serve better", "The close can sometimes get lost in the energy of the story"], "customers": "You work brilliantly with Expressive and Amiable customers. With Analytical customers, balance your storytelling with precise technical detail.", "moment": "You shine when a customer is making an emotionally significant purchase \u2014 an engagement, a milestone gift \u2014 and needs both the expertise and the story of the piece.", "next_stage": "Expert Advisor: End every story with a recommendation. The close is the last line of the story \u2014 write it.", "trainerNote": "Strong communicator and genuine problem solver. Development goal: ensuring technical depth matches storytelling ability, and that every story ends in a clear recommendation.", "focus1": "Technical depth behind the story", "f1sub": "Expertise earns the story", "focus2": "The recommendation as the ending", "f2sub": "Every story needs a close", "idp": [{"area": "Technical expertise", "gap": "Story outpaces substance", "action70": "Learn one deep technical fact per week \u2014 not just what it is but why it matters to a customer \u2014 and weave it into your storytelling", "action20": "Ask your manager to give you a product knowledge quiz monthly", "action10": "Review your 4Cs assessment breakdown \u2014 study the weakest category specifically"}, {"area": "Story-to-close", "gap": "Story ends without recommendation", "action70": "End every product story with: 'And that is why I think this is the right one for you' \u2014 practise this ending in every interaction", "action20": "Role-play with manager: the story-to-close transition \u2014 time your stories at 90 seconds maximum", "action10": "Study IGI Module 5 \u2014 the assumptive close and consultative close techniques"}]}, "Expressive-EA": {"title": "The Inspiring Expert", "body": "You are exceptional \u2014 expert, warm, compelling, and genuinely invested in your customers. Clients seek you out, remember you, and tell their friends about you. The final step to Trusted Advisor is consistency \u2014 bringing this full quality to every interaction, not just the high-value or high-energy ones. Your best should be the standard, not the highlight.", "strengths": ["Combines world-class communication with genuine product expertise", "Creates experiences that customers talk about and share", "A magnet for high-value, high-trust customer relationships"], "watchouts": ["Consistency across all interactions \u2014 not just the exciting ones", "Quieter or simpler interactions deserve the same quality", "The final step is systematic relationship management alongside natural brilliance"], "customers": "You serve all customer types with distinction. The one to watch: making sure quieter, less emotionally engaging customers get the same full version of you.", "moment": "You shine in every significant customer moment \u2014 and increasingly in everyday interactions that you elevate into something memorable.", "next_stage": "Trusted Advisor: Make your best performance the floor, not the ceiling. Consistency is the final step.", "trainerNote": "Outstanding performer very close to the top. Development goal: systematic consistency \u2014 CRM discipline and relationship follow-through that matches the brilliance of live interactions.", "focus1": "Consistent brilliance", "f1sub": "Every interaction, not just big ones", "focus2": "CRM follow-through", "f2sub": "Structure behind the spark", "idp": [{"area": "Interaction consistency", "gap": "Peak performance not consistent across all interactions", "action70": "Set a personal standard: every interaction \u2014 regardless of value or complexity \u2014 gets your full presence and quality", "action20": "Ask your manager to observe 3 different types of interaction this week and give feedback on consistency", "action10": "Study IGI Module 8 \u2014 the PRIDE framework and how it applies to every single Moment of Truth"}, {"area": "CRM discipline", "gap": "Relationship management less systematic than the interaction quality", "action70": "Build a simple system: after every significant interaction, note the key personal detail and next occasion in your client record", "action20": "Review your client records with manager fortnightly", "action10": "Study IGI Module 7 \u2014 the post-purchase engagement and relationship management framework"}]}, "Expressive-TrA": {"title": "The Legendary Performer", "body": "You are the associate that other associates aspire to become. You combine deep expertise, compelling communication, and genuine relationship investment in a way that is commercially exceptional and personally unforgettable. Customers are loyal to you for life. Your next chapter is creating more people like you.", "strengths": ["Iconic floor presence that elevates the whole store's atmosphere", "Loyal client relationships that generate consistent referrals and high-value repeat business", "The gold standard for what jewellery retail excellence looks like"], "watchouts": ["Protect your energy \u2014 sustaining this level requires conscious self-management", "Invest in mentoring \u2014 your approach needs to be teachable, not just demonstrated", "Stay humble and curious \u2014 even at this level, the customer can always teach you something"], "customers": "You transcend customer type \u2014 you adapt and excel with everyone.", "moment": "You create the moments that customers describe for years. The question is no longer what your moment is \u2014 it is how many people you help find theirs.", "next_stage": "You have mastered the maturity scale. Now build the next generation of Trusted Advisors.", "trainerNote": "Peak performer. Invest significantly in their mentorship role. Consider formal coaching qualifications or a training leadership pathway.", "focus1": "Building the next generation", "f1sub": "Your legacy on the floor", "focus2": "Sustainable excellence", "f2sub": "Self-management at the top", "idp": [{"area": "Formal mentorship", "gap": "Exceptional skill not yet systematically transferred", "action70": "Take on one formal mentee \u2014 weekly structured session using real customer interactions as case studies", "action20": "Co-design a role-play module with your manager based on your own best practices", "action10": "Study coaching methodology \u2014 how to develop others rather than demonstrate to them"}, {"area": "Self-sustainability", "gap": "High performance has high energy demands", "action70": "Build deliberate recovery habits into your working week \u2014 identify what restores your energy and protect it", "action20": "Monthly wellbeing and performance conversation with your manager", "action10": "Read one resource on sustainable high performance in customer-facing roles"}]}, "Driver-PP": {"title": "The Decisive Pusher", "body": "You are direct, confident, and results-focused. You get to the point and you move things forward. Right now the directness is serving the transaction, not the customer's real need. The shift to Transaction Achiever is simple: before you direct, ask. One question before every recommendation.", "strengths": ["Confident and decisive \u2014 customers get clear guidance", "Efficient and purposeful \u2014 no time wasted", "Comfortable making recommendations without hesitation"], "watchouts": ["Directs before discovering \u2014 the recommendation comes before the need is understood", "Customers can feel told rather than guided", "May close conversations too quickly by moving to the product before the customer is ready"], "customers": "You work naturally with Driver customers who want efficiency and decisiveness. With Amiable and Expressive customers, invest in the opening warmth \u2014 it will dramatically improve your conversion.", "moment": "You shine with time-pressed, decisive customers who know what they want and need someone to help them get it quickly.", "next_stage": "Transaction Achiever: Ask one question before every recommendation. Just one. It changes everything.", "trainerNote": "High confidence and decisiveness are real assets. Development goal: inserting discovery before recommendation \u2014 one question minimum before every product mention.", "focus1": "Ask before you recommend", "f1sub": "One question, every time", "focus2": "Opening warmth", "f2sub": "2 minutes before business", "idp": [{"area": "Discovery first", "gap": "Recommends before understanding", "action70": "Set a rule: ask one question about the occasion or the customer before mentioning any product \u2014 in every interaction, no exceptions", "action20": "Ask your manager to observe whether you ask or recommend first in each interaction", "action10": "Study IGI Module 3 \u2014 the questioning framework and the importance of uncovering the implicit need"}, {"area": "Warmth opening", "gap": "Direct without connection", "action70": "Start every customer interaction with 2 minutes of genuine personal conversation before any product discussion", "action20": "Role-play the warm opening with manager \u2014 practise making it feel natural, not performed", "action10": "Study IGI Module 2 \u2014 the Amiable customer quadrant and what they need from the opening"}]}, "Driver-TA": {"title": "The Efficient Achiever", "body": "You get transactions done with confidence and clarity. Customers leave having made a decision and feeling served. The move to Problem Solver requires you to slow down the discovery phase. You are efficient \u2014 use that efficiency to ask better questions faster, not to skip the questions entirely.", "strengths": ["Reliable and consistent \u2014 customers get clear, confident guidance", "Efficient interactions that respect the customer's time", "Strong accountability and follow-through on commitments"], "watchouts": ["Efficiency can crowd out genuine discovery", "Interactions are professional but may not be deeply consultative", "The pace of the Driver style can close conversations before the real need emerges"], "customers": "You work well with Driver and Analytical customers. Invest more time and warmth with Amiable and Expressive customers.", "moment": "You shine with repeat customers who trust your judgement and want efficient, high-quality service.", "next_stage": "Problem Solver: Add one deep question to your standard discovery. Not more time \u2014 just more depth.", "trainerNote": "Solid achiever. Development goal: adding depth to discovery without sacrificing efficiency. The challenge: one deeper question that opens the real need.", "focus1": "One deeper question", "f1sub": "Efficient but not shallow", "focus2": "Patience in discovery", "f2sub": "Slow down before speeding up", "idp": [{"area": "Discovery depth", "gap": "Efficient but surface-level discovery", "action70": "Add one deep question to your standard opening \u2014 'What is the occasion and what do you want them to feel when they receive this?' \u2014 in every interaction", "action20": "Weekly debrief with manager: what did you learn about the real need in each key interaction?", "action10": "Study IGI Module 3 \u2014 the implicit vs explicit needs framework"}, {"area": "Patience", "gap": "Closes discovery phase too quickly", "action70": "Set a minimum: 3 questions answered before any product recommendation \u2014 time yourself", "action20": "Role-play with a colleague who deliberately gives incomplete answers \u2014 practise following up", "action10": "Study IGI Module 3 \u2014 the listening framework section on patience and silence"}]}, "Driver-PS": {"title": "The Decisive Solver", "body": "You combine problem-solving ability with decisive action. You understand what customers need and you move efficiently to serve them. The step to Expert Advisor is about relationship depth. Your transactions are excellent. Now build the layer of personal knowledge and ongoing relationship that turns one-time customers into lifetime ones.", "strengths": ["Combines genuine problem-solving with decisive action", "Customers feel well-served and efficiently guided", "Strong follow-through that builds reliability and trust"], "watchouts": ["Relationship investment tends to follow results rather than precede them", "May not invest enough in the personal layer of the client relationship", "The personal connection that creates loyalty needs more deliberate investment"], "customers": "You work well with Driver and Analytical customers. Push yourself to invest in the long-term relationship layer with Amiable customers who need to feel known personally.", "moment": "You shine when a customer needs a problem solved decisively and efficiently \u2014 you bring both the answer and the confidence.", "next_stage": "Expert Advisor: Start a client record for your top 10 customers. Know them beyond their purchase history.", "trainerNote": "Strong problem solver and decisive actor. Development goal: intentional relationship investment beyond the transaction. Push them to build personal knowledge of their top clients.", "focus1": "Personal client knowledge", "f1sub": "Beyond purchase history", "focus2": "Long-term relationship investment", "f2sub": "Slow conversations with top clients", "idp": [{"area": "Client relationship depth", "gap": "Transaction-focused without relationship layer", "action70": "Create a client record for your top 10 customers: name, family details, occasions, preferences, last purchase and its story \u2014 review before every visit", "action20": "Monthly review with manager: which of your top clients do you know personally beyond their purchases?", "action10": "Study IGI Module 7 \u2014 the Transaction vs Value-based relationship comparison"}, {"area": "Intentional warmth", "gap": "Warmth as a means, not a habit", "action70": "In every client interaction, open with one genuinely personal comment or question \u2014 not about the product", "action20": "Ask your manager to rate your warmth score in 3 interactions per week", "action10": "Study IGI Module 2 \u2014 the Amiable customer quadrant and what makes them feel genuinely valued"}]}, "Driver-EA": {"title": "The Decisive Authority", "body": "You are a trusted expert with strong commercial instincts. Customers respect your directness and trust your recommendations. The final step to Trusted Advisor is deepening the emotional and relational layer \u2014 not because the results require it, but because the client deserves it. Your expertise is established. Now add the intimacy.", "strengths": ["Highly trusted for expertise and directness", "Recommendations carry real weight \u2014 customers act on them confidently", "Strong accountability and results orientation that clients rely on"], "watchouts": ["Can still lean on expertise when relationship warmth would serve better", "May not always create the emotional depth that turns customers into advocates", "The final step requires vulnerability and genuine investment in the client as a person"], "customers": "You serve Driver and Analytical customers excellently. With Amiable and Expressive customers, consciously add the emotional layer \u2014 it is the difference between respected and loved.", "moment": "You shine when a customer needs confident, authoritative guidance on a complex or high-value decision.", "next_stage": "Trusted Advisor: Add one personal moment to every interaction. Not professional \u2014 personal. Ask about their life, not their purchase.", "trainerNote": "Near the top of the scale. Development goal: the personal layer \u2014 genuine relationship investment beyond professional excellence. Challenge them to ask one personal question per interaction.", "focus1": "The personal question", "f1sub": "Professional is not enough at the top", "focus2": "Emotional investment", "f2sub": "Known, not just trusted", "idp": [{"area": "Personal connection", "gap": "Professional depth without personal intimacy", "action70": "In every significant client interaction, ask one genuinely personal question \u2014 not about jewellery, about their life", "action20": "Discuss with manager: which of your top clients know you as a person, not just an expert?", "action10": "Study the Trusted Advisor model \u2014 the Intimacy dimension and why it matters at the highest level"}, {"area": "Emotional expression", "gap": "Trust without warmth", "action70": "Practise expressing genuine positive emotion in interactions \u2014 delight, care, appreciation \u2014 not just competence", "action20": "Ask your manager to observe the warmth dimension specifically in 3 interactions per week", "action10": "Study IGI Module 4 \u2014 the Ethos-Pathos-Logos framework, focus on the Pathos dimension"}]}, "Driver-TrA": {"title": "The Trusted Commander", "body": "You combine authoritative expertise with genuine relationship investment in a way that commands both respect and loyalty. Clients follow your advice, refer their most important relationships to you, and trust you with their most significant occasions. You are the associate that others measure themselves against.", "strengths": ["Combines decisive authority with trusted relationship depth", "Clients rely on your judgement for their most important purchases", "Sets the professional standard that elevates the whole team"], "watchouts": ["Your directness at this level is an asset \u2014 protect it from softening under team pressure", "Invest deliberately in mentoring \u2014 your directness is a teachable skill", "Stay curious and keep your product knowledge razor-sharp"], "customers": "You serve all customer types at the highest level. Your directness adapts without compromising.", "moment": "Every significant customer moment is yours. You bring decisive expertise and genuine care in equal measure.", "next_stage": "You are at the top of the maturity scale. Build the next generation of Trusted Advisors.", "trainerNote": "Peak Driver-profile performer. Invest in their mentorship role \u2014 specifically their ability to teach decisiveness and directness as positive skills. Consider leadership pathway.", "focus1": "Teaching decisive confidence", "f1sub": "Your directness as a gift to others", "focus2": "Sustained excellence", "f2sub": "The standard, not the exception", "idp": [{"area": "Mentoring through directness", "gap": "Decisiveness not yet systematically shared", "action70": "Mentor one junior colleague specifically on how to give confident, direct recommendations \u2014 weekly 15-minute session", "action20": "Co-observe a junior colleague's interaction and give them specific, direct feedback after", "action10": "Study coaching methodology \u2014 how to transfer decisive confidence rather than demonstrating it"}, {"area": "Legacy building", "gap": "Individual excellence not multiplied", "action70": "Identify one practice you use that no one else on the team uses \u2014 document it and teach it this month", "action20": "Quarterly conversation with manager about your leadership development pathway", "action10": "Read one resource on scaling personal excellence into team excellence"}]};
const C2S_MATRIX = [[4, 3, 2, 1], [3, 1, 2, 4], [2, 1, 4, 3], [4, 3, 2, 1], [3, 2, 1, 4], [2, 1, 3, 4], [2, 4, 3, 1], [2, 3, 1, 4], [1, 2, 4, 3], [4, 3, 1, 2], [2, 3, 1, 4], [4, 3, 2, 1], [4, 3, 1, 2], [1, 2, 3, 4], [1, 2, 3, 4], [4, 1, 3, 2], [1, 2, 4, 3], [4, 1, 3, 2], [1, 2, 3, 4], [3, 2, 1, 4], [4, 2, 1, 3], [1, 4, 2, 3], [1, 4, 3, 2], [4, 3, 2, 1]];

// ═══ C2S QUESTIONS ═══════════════════════════════════════
const C2S_Q=[
  {q:"Most people think of me as",opts:["One who gets results","A good talker","A good listener","A perfectionist"]},
  {q:"My greatest need is to be",opts:["With people","Given time to change","Encouraged","Given frank directions"]},
  {q:"I am",opts:["Easy on others","Organized","Dynamic","A good mixer"]},
  {q:"I have a tendency to be",opts:["Competitive","Bubbly","Considerate","Agreeable with others"]},
  {q:"My greatest fear is",opts:["Rejection","Conflict","Being wrong","Loss of control"]},
  {q:"I do my best when",opts:["Working with others","Working by myself","Doing what I am told","Following the rules"]},
  {q:"I see myself as",opts:["Reliable","Firm","Optimistic","Diligent"]},
  {q:"I would rather",opts:["Counsel","Persuade","Solve a problem","Give directions to others"]},
  {q:"I dislike ____ the most",opts:["Involvement","Conflict","Inaction","Being alone"]},
  {q:"I feel I am",opts:["Playful","Effective","Considerate","Accurate"]},
  {q:"When upset, I",opts:["Give in","Become verbal","Leave the situation","Explode"]},
  {q:"When I have a special job to do, I like to",opts:["Be impulsive","Be direct","Be supportive","Gather information"]},
  {q:"When playing a game, I enjoy the ____ the most",opts:["Sociability","Excitement of winning","Playing the game","Testing of my knowledge"]},
  {q:"Select the word that best describes you",opts:["Precise","Attentive","Enthusiastic","Direct"]},
  {q:"Select the word that best describes you",opts:["Modest","Social","Self-reliant","Systematic"]},
  {q:"Select the word that best describes you",opts:["Decisive","Calm","Talkative","Loyal"]},
  {q:"Select the word that best describes you",opts:["Orderly","Harmonious","Efficient","Convincing"]},
  {q:"Select the word that best describes you",opts:["Generous","Popular","Outspoken","Disciplined"]},
  {q:"Select the word that best describes you",opts:["Objective","Accommodating","Motivating","Assertive"]},
  {q:"Select the word that best describes you",opts:["Charming","Contented","Diplomatic","Determined"]},
  {q:"Select the phrase that best describes you",opts:["Doesn't give up","Even-tempered","Not extreme","Happy and playful"]},
  {q:"Select the phrase that best describes you",opts:["Follows the rules","Takes risks","Patient","Life of the party"]},
  {q:"Select the word that best describes you",opts:["Cautious","Determined","Persuasive","Friendly"]},
  {q:"Select the word that best describes you",opts:["Daring","Convincing","Considerate","Consistent"]}
];
const C2S_MATRIX=[[4,3,2,1],[3,1,2,4],[2,1,4,3],[4,3,2,1],[3,2,1,4],[2,1,3,4],[2,4,3,1],[2,3,1,4],[1,2,4,3],[4,3,1,2],[2,3,1,4],[4,3,2,1],[4,3,1,2],[1,2,3,4],[1,2,3,4],[4,1,3,2],[1,2,4,3],[4,1,3,2],[1,2,3,4],[3,2,1,4],[4,2,1,3],[1,4,2,3],[1,4,3,2],[4,3,2,1]];

// ═══ RSP QUESTIONS ═══════════════════════════════════════
const RSP_Q=[
  {q:"A new customer walks in browsing quietly. What is your instinct?",opts:["Approach immediately, introduce yourself and open the conversation","Give them space, observe, then approach when they seem ready","Ask a warm open question: 'What brings you in today?'","Smile, make eye contact and let them feel welcome first"],scores:["H","F","A","C"]},
  {q:"A customer is hesitating on a purchase. You:",opts:["Create urgency — mention limited stock or a special offer today","Ask what is holding them back and address it patiently","Offer expert insight — explain why this piece is right for them","Share a story of another happy customer with a similar choice"],scores:["H","F","A","C"]},
  {q:"When the store is quiet, you are most likely to:",opts:["Review your targets and plan how to reach them today","Organise your client database and send warm check-ins","Research new product knowledge to share with customers","Reach out to past customers personally to reconnect"],scores:["H","F","A","C"]},
  {q:"A customer says they will think about it and come back. You:",opts:["Ask what would help them decide today before they leave","Note their name and follow up warmly later","Offer more information to help clarify their decision","Tell them you will personally ensure the best experience when they return"],scores:["H","F","A","C"]},
  {q:"After completing a sale, you are most likely to:",opts:["Move on quickly to identify the next sales opportunity","Send a follow-up message thanking them and checking in","Share an interesting fact about their purchase","Ask for a review and offer to help their friends or family"],scores:["H","F","A","C"]},
  {q:"Your greatest strength on the sales floor is:",opts:["Converting browsers into buyers quickly","Building long-term relationships with loyal customers","Being the most trusted product expert in the store","Creating memorable emotional connections with customers"],scores:["H","F","A","C"]},
  {q:"A loyal customer visits but does not buy anything today. You:",opts:["Try to find something to close before they leave","Enjoy the conversation and trust they will buy next time","Share new arrivals and product knowledge to spark interest","Make sure they feel valued and leave with a smile"],scores:["H","F","A","C"]},
  {q:"How do you typically build trust with a new customer?",opts:["By being confident and direct about what suits them","By being patient, consistent and remembering their preferences","By demonstrating deep knowledge and honest recommendations","By making them feel genuinely welcome and cared for"],scores:["H","F","A","C"]},
  {q:"A customer asks you to compare two similar pieces. You:",opts:["Guide them quickly toward the better-value option","Listen to their priorities and let them lead the decision","Give a detailed, honest comparison based on quality and craft","Focus on which piece will make them feel most special"],scores:["H","F","A","C"]},
  {q:"What motivates you most at work?",opts:["Hitting and exceeding your sales targets","Seeing customers return again and again for you specifically","Being the most knowledgeable person on the floor","Being remembered as someone who made the experience extraordinary"],scores:["H","F","A","C"]},
  {q:"A customer mentions a competitor has a similar piece for less. You:",opts:["Highlight your unique value and create urgency to decide now","Stay calm, acknowledge their right to compare, and nurture the relationship","Provide an honest, expert comparison of quality and craftsmanship","Focus on the experience they will have here and how valued they will feel"],scores:["H","F","A","C"]},
  {q:"When preparing for a high-value customer visit, you:",opts:["Plan your close strategy and talking points in advance","Review notes from past interactions to personalise the conversation","Research the specific pieces they may be interested in","Think about how to make the visit feel special and memorable"],scores:["H","F","A","C"]},
  {q:"A customer has a complaint. Your first response is to:",opts:["Resolve it quickly and efficiently, then look for a recovery sale","Listen fully, empathise, and make them feel completely heard","Analyse what went wrong and explain it clearly and honestly","Apologise warmly, reassure, and make them feel genuinely valued"],scores:["H","F","A","C"]},
  {q:"Which moment in the customer journey do you enjoy most?",opts:["The close — when the customer says yes","The return visit — when they come back to you","The discovery moment — when you find exactly what they need","The reaction — when they light up trying something on"],scores:["H","F","A","C"]},
  {q:"How do you typically end a customer interaction, even if they did not buy?",opts:["With a clear follow-up plan and next step agreed","With a warm personal goodbye and a note for next time","With a helpful recommendation or resource for their consideration","With a genuine moment of connection that they will remember"],scores:["H","F","A","C"]},
  {q:"A colleague asks what your secret to great customer service is. You say:",opts:["Know your numbers, stay focused, and always be closing","Be consistent, remember everything, and build real relationships","Know your product better than anyone and always be honest","Make every single person who walks in feel like the most important customer you have ever had"],scores:["H","F","A","C"]}
];

// ═══ 4Cs QUESTION BANKS ══════════════════════════════════
const FCS_SHARED=[
  {q:"What does the term 'Carat' specifically measure in a diamond?",opts:[{t:"Size",c:false},{t:"Weight",c:true},{t:"Diameter",c:false},{t:"Depth",c:false}]},
  {q:"How many milligrams is equal to 1 carat?",opts:[{t:"50 mg",c:false},{t:"100 mg",c:false},{t:"200 mg",c:true},{t:"400 mg",c:false}]},
  {q:"Which is the highest grade on the normal color grading scale for diamonds?",opts:[{t:"A",c:false},{t:"D",c:true},{t:"Z",c:false},{t:"G",c:false}]},
  {q:"A diamond graded 'H' in color is categorized as:",opts:[{t:"Colorless",c:false},{t:"Near Colorless",c:true},{t:"Faint Yellow",c:false},{t:"Very Light Yellow",c:false}]},
  {q:"What does the 'Clarity' grade assess?",opts:[{t:"Polish and symmetry",c:false},{t:"Transparency",c:false},{t:"Blemishes and inclusions",c:true},{t:"Brightness and fire",c:false}]},
  {q:"A diamond completely free of inclusions and blemishes under 10X magnification may earn which grade?",opts:[{t:"VVS1",c:false},{t:"IF (Internally Flawless)",c:false},{t:"FL (Flawless)",c:true},{t:"VS1",c:false}]},
  {q:"What is the general term for characteristics trapped inside a diamond?",opts:[{t:"Blemishes",c:false},{t:"Inclusions",c:true},{t:"Flaws / Carbon",c:false},{t:"Cracks",c:false}]},
  {q:"Which cut grade represents the highest standard of proportions, polish, and symmetry?",opts:[{t:"Good",c:false},{t:"Very Good",c:false},{t:"Excellent-Ideal",c:true},{t:"Fair",c:false}]},
  {q:"In a well-cut polished diamond, what happens to the light entering the stone?",opts:[{t:"Leaks through the bottom",c:false},{t:"Escapes from the sides",c:false},{t:"Reflects back to the viewer",c:true},{t:"Gets absorbed",c:false}]},
  {q:"What does 'Eye-Clean' mean in diamond retail terminology?",opts:[{t:"Internally Flawless",c:false},{t:"No characteristics visible to the naked eye",c:true},{t:"Perfectly white",c:false},{t:"No fluorescence",c:false}]},
  {q:"Which is NOT one of the traditional 4Cs of diamonds?",opts:[{t:"Cut",c:false},{t:"Clarity",c:false},{t:"Carat",c:false},{t:"Cost",c:true}]},
  {q:"'SI1' stands for:",opts:[{t:"Super Included 1",c:false},{t:"Slightly Included 1",c:true},{t:"Semi Included 1",c:false},{t:"Surface Included 1",c:false}]},
  {q:"The factor that produces a diamond's brightness, fire and contrast is:",opts:[{t:"Carat weight",c:false},{t:"Color grade",c:false},{t:"Cut quality",c:true},{t:"Clarity grade",c:false}]},
  {q:"Which color grade range is considered 'Colorless'?",opts:[{t:"D-F",c:true},{t:"G-J",c:false},{t:"K-M",c:false},{t:"N-Z",c:false}]},
  {q:"What is 'Fire' in a diamond?",opts:[{t:"The sparkle seen when the diamond is moved",c:false},{t:"Dispersed light seen as spectral colors",c:true},{t:"Reflections of colors in the environment",c:false},{t:"The overall brightness of the stone",c:false}]}
];
const FCS_NATURAL=[
  {q:"Natural diamonds are formed over approximately how long?",opts:[{t:"10,000 years",c:false},{t:"1 million years",c:false},{t:"1 to 3 billion years",c:true},{t:"500 million years",c:false}]},
  {q:"A customer asks why natural diamonds cost more than lab grown. The best answer is:",opts:[{t:"Lab grown are inferior quality",c:false},{t:"Natural diamonds are rarer — formed over billions of years under immense pressure, finite in supply",c:true},{t:"IGI charges more to certify them",c:false},{t:"Natural diamonds are always bigger",c:false}]},
  {q:"Which of the following is a major natural diamond producing country?",opts:[{t:"Brazil",c:false},{t:"Botswana",c:true},{t:"Bangladesh",c:false},{t:"Bolivia",c:false}]},
  {q:"What is the Kimberley Process?",opts:[{t:"An IGI grading system",c:false},{t:"A diamond cutting technique",c:false},{t:"An international certification scheme to prevent conflict diamonds",c:true},{t:"A color grading method",c:false}]},
  {q:"A customer says natural diamonds lose value immediately. The best response is:",opts:[{t:"That is completely true",c:false},{t:"High quality natural diamonds have historically held or appreciated in value, unlike most luxury purchases",c:true},{t:"All diamonds lose value",c:false},{t:"Only colored diamonds hold value",c:false}]},
  {q:"What makes each natural diamond unique as a selling point?",opts:[{t:"Its certificate number",c:false},{t:"Its price tag",c:false},{t:"Its natural inclusions — formed over billions of years, no two are exactly alike",c:true},{t:"Its cut grade",c:false}]},
  {q:"A customer asks how to verify their IGI certificate is genuine. The best response is:",opts:[{t:"Tell them to trust the store",c:false},{t:"Explain they can verify their IGI certificate instantly at report.igi.org using the report number",c:true},{t:"Say only a gemologist can verify it",c:false},{t:"Tell them the laser inscription is enough proof",c:false}]},
  {q:"Which color grade range is considered 'Near Colorless'?",opts:[{t:"D-F",c:false},{t:"G-J",c:true},{t:"K-M",c:false},{t:"N-Z",c:false}]},
  {q:"A customer is concerned about ethical sourcing of their natural diamond. You should:",opts:[{t:"Change the subject",c:false},{t:"Explain that all diamonds today are conflict-free, mention the Kimberley Process and your supplier's chain of custody",c:true},{t:"Tell them lab grown is the only ethical choice",c:false},{t:"Say you are not sure",c:false}]},
  {q:"What is the best way to describe a natural diamond's value to a romantically motivated customer?",opts:[{t:"A financial investment",c:false},{t:"A piece of the earth formed over billions of years — as rare and unique as the relationship it represents",c:true},{t:"A commodity like gold",c:false},{t:"A product of mining",c:false}]}
];
const FCS_LGD=[
  {q:"What are the two main processes used to create lab grown diamonds?",opts:[{t:"CVD and HPHT",c:true},{t:"IGI and GIA",c:false},{t:"UV and LED",c:false},{t:"Natural and Synthetic",c:false}]},
  {q:"A customer asks: is a lab grown diamond a real diamond? The best answer is:",opts:[{t:"No, it is synthetic",c:false},{t:"Yes — it is chemically, physically and optically identical to a natural diamond, created in a lab rather than mined",c:true},{t:"It depends on the grade",c:false},{t:"Only if it is IGI certified",c:false}]},
  {q:"CVD stands for:",opts:[{t:"Carbon Vapour Deposit",c:false},{t:"Chemical Vapour Deposition",c:true},{t:"Crystal Value Diamond",c:false},{t:"Certified Verified Diamond",c:false}]},
  {q:"Why are lab grown diamonds typically priced lower than natural diamonds of the same grade?",opts:[{t:"They are lower quality",c:false},{t:"They are not certified",c:false},{t:"They can be produced at scale — the price reflects supply, not quality",c:true},{t:"IGI does not certify them",c:false}]},
  {q:"A customer says their budget is limited but they want a bigger diamond. Why is lab grown a good recommendation?",opts:[{t:"It is lower quality so cheaper",c:false},{t:"It allows them to access a larger, higher-grade stone within their budget without compromising on the 4Cs",c:true},{t:"It will appreciate in value",c:false},{t:"It is easier to insure",c:false}]},
  {q:"How should you describe the sustainability story of a lab grown diamond to a conscious consumer?",opts:[{t:"Avoid the topic",c:false},{t:"Lab grown diamonds have a significantly lower land impact than mined diamonds and are a modern, conscious luxury choice",c:true},{t:"Tell them all diamonds are the same",c:false},{t:"Only mention it if asked directly",c:false}]},
  {q:"Which organisation certifies lab grown diamonds with the same rigour as natural diamonds?",opts:[{t:"Only GIA",c:false},{t:"IGI certifies both natural and lab grown diamonds to the same grading standards",c:true},{t:"No organisation certifies lab grown",c:false},{t:"Only GCAL",c:false}]},
  {q:"A customer compares a natural and lab grown of identical 4Cs. What is most important to help them understand?",opts:[{t:"Always recommend natural",c:false},{t:"Always recommend lab grown",c:false},{t:"Help them understand natural rarity vs lab grown accessibility — and let them decide based on what matters most to them",c:true},{t:"Tell them price is the only difference",c:false}]},
  {q:"What does HPHT stand for in lab grown diamond creation?",opts:[{t:"High Pressure High Temperature",c:true},{t:"Highly Polished High Transparency",c:false},{t:"Hydrogen Pressure Heat Treatment",c:false},{t:"Heavy Particle Heat Technology",c:false}]},
  {q:"A customer asks if a lab grown diamond will look different from a natural one. You say:",opts:[{t:"Yes, you can clearly see the difference",c:false},{t:"No — even trained gemologists cannot distinguish them with the naked eye. Only specialised equipment can detect the difference",c:true},{t:"Only under magnification",c:false},{t:"Only in certain lighting",c:false}]}
];

// ═══ UTILITIES ═══════════════════════════════════════════
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function buildFCSBank(dt){
  let specific=[],specificTags=[];
  if(dt==='natural'){specific=FCS_NATURAL;specificTags=FCS_NATURAL_TAGS;}
  else if(dt==='lgd'){specific=FCS_LGD;specificTags=FCS_LGD_TAGS;}
  else{specific=[...FCS_NATURAL.slice(0,5),...FCS_LGD.slice(0,5)];specificTags=[...FCS_NATURAL_TAGS.slice(0,5),...FCS_LGD_TAGS.slice(0,5)];}
  const allQ=[...FCS_SHARED,...specific];
  const allTags=[...FCS_SHARED_TAGS,...specificTags];
  // Shuffle questions keeping tags aligned
  const indices=shuffle([...Array(allQ.length).keys()]);
  return{
    questions:indices.map(i=>{
      const q=allQ[i];
      const shuffledOpts=shuffle(q.opts);
      return{q:q.q,opts:shuffledOpts,tag:allTags[i]};
    }),
    originalTags:allTags
  };
}

// ═══ BLEND ANALYSIS ══════════════════════════════════════
const DEFINED_GAP=4, LEANING_GAP=2;

function analyseC2S(scores){
  const sorted=Object.entries(scores).map(([k,v])=>([parseInt(k),v])).sort((a,b)=>b[1]-a[1]);
  const gap=sorted[0][1]-sorted[1][1];
  const primary=sorted[0][0], secondary=sorted[1][0];
  let classification,label,blendNarrative='';
  if(gap>=DEFINED_GAP){classification='Defined';label=C2S_NAMES[primary];}
  else if(gap>=LEANING_GAP){classification='Leaning';label=C2S_NAMES[primary]+' ('+C2S_NAMES[secondary]+' influence)';}
  else{
    classification='Blended';label=C2S_NAMES[primary]+' · '+C2S_NAMES[secondary];
    const key=[primary,secondary].sort().join('-');
    blendNarrative=C2S_BLEND[key]||'';
  }
  return{primary,secondary,classification,label,blendNarrative,sorted};
}

function getRSPStage(avg){
  for(let i=RSP_STAGES.length-1;i>=0;i--){
    if(avg>=RSP_STAGES[i].min) return RSP_STAGES[i];
  }
  return RSP_STAGES[0];
}
function analyseRSP(rspResult){
  const stage=getRSPStage(rspResult.avg);
  return{
    avg:rspResult.avg,
    stage:stage,
    label:stage.label,
    key:stage.key,
    classification:'Score: '+rspResult.avg.toFixed(2),
    blendNarrative:''
  };
}}

// ═══ SCORING ═════════════════════════════════════════════
const C2S_COUNT=24,RSP_COUNT=16,FCS_COUNT=25;
const TOTAL_BEHAV=C2S_COUNT+RSP_COUNT;

function scoreC2S(){
  const t={1:0,2:0,3:0,4:0};
  c2sAnswers.forEach((ans,i)=>{if(ans!==null) t[C2S_MATRIX[i][ans]]++;});
  return t;
}
function scoreRSP(){
  let total=0,count=0;
  rspAnswers.forEach((ans,i)=>{
    if(ans!==null && RSP_Q[i] && RSP_Q[i].opts[ans]!==undefined){
      total+=RSP_Q[i].opts[ans].s;
      count++;
    }
  });
  const avg=count>0?Math.round((total/count)*100)/100:1.0;
  return{avg,count,total};
}}
function scoreFCS(){
  let correct=0,tagScores={};
  fcsAnswers.forEach((ans,i)=>{
    if(ans!==null&&fcsBank.questions[i]&&fcsBank.questions[i].opts[ans]){
      const tag=fcsBank.questions[i].tag||'general';
      if(!tagScores[tag]) tagScores[tag]={correct:0,total:0};
      tagScores[tag].total++;
      if(fcsBank.questions[i].opts[ans].c){correct++;tagScores[tag].correct++;}
    }
  });
  return{correct,tagScores};
}

function getFCSGrade(pct){
  if(pct>=90) return{label:'Diamond Expert',color:'#C9A84C',flag:false};
  if(pct>=76) return{label:'4Cs Proficient',color:'#1D9E75',flag:false};
  if(pct>=56) return{label:'On Your Way',color:'#378ADD',flag:false};
  return{label:'Technical Training Recommended',color:'#C94A4A',flag:true};
}

function getReadiness(c2sAnalysis,rspAnalysis,fcsCorrect){
  const knowledgePts=Math.round((fcsCorrect/25)*70);
  const c2sVals=c2sAnalysis.sorted.map(x=>x[1]);
  const rspVals=rspAnalysis.sorted.map(x=>x[1]);
  const c2sClarity=Math.min(15,Math.round((Math.max(0,c2sVals[0]-c2sVals[1])/24)*30));
  const rspClarity=Math.min(15,Math.round((Math.max(0,rspVals[0]-rspVals[1])/16)*30));
  const behaviouralPts=Math.min(30,c2sClarity+rspClarity);
  const total=Math.min(100,knowledgePts+behaviouralPts);
  const c2sClarityPct=(c2sVals[0]/24)*100;
  const rspClarityPct=(rspVals[0]/16)*100;
  return{
    total,knowledgePts,behaviouralPts,
    c2sClarityLabel:c2sClarityPct>=50?'Strong':c2sClarityPct>=35?'Moderate':'Blended',
    rspClarityLabel:rspClarityPct>=50?'Strong':rspClarityPct>=35?'Moderate':'Blended'
  };
}

function getReadinessBand(score){
  if(score>=85) return{label:'Outstanding',color:'#C9A84C'};
  if(score>=70) return{label:'Proficient',color:'#1D9E75'};
  if(score>=55) return{label:'Developing',color:'#378ADD'};
  return{label:'Foundation',color:'#C9613A'};
}

// ═══ STATE ═══════════════════════════════════════════════
let currentQ=0,fcsCurrentQ=0;
let fcsTimer=null,behavTimer=null;
let fcsSecs=FCS_SECS,behavSecs=BEHAV_SECS;
let behavTimerRunning=false;
const c2sAnswers=new Array(24).fill(null);
const rspAnswers=new Array(16).fill(null);
const fcsAnswers=new Array(25).fill(null);
let fcsBank={};
let diamondType='natural';
const SESSION_KEY='igi_arp_'+(BATCH||'default');

if(ALLOW_RESET) sessionStorage.removeItem(SESSION_KEY);

// ═══ TIMERS ═══════════════════════════════════════════════
function startFCSTimer(){
  document.getElementById('timerBar').classList.remove('hidden');
  document.getElementById('timerLabel').textContent='Section 1: Diamond Knowledge';
  document.getElementById('timerDisplay').textContent='15:00';
  fcsTimer=setInterval(()=>{
    fcsSecs--;
    updateTimer(fcsSecs,'timerDisplay','timerBar');
    if(fcsSecs<=0){clearInterval(fcsTimer);document.getElementById('fcsTimerOverlay').classList.remove('hidden');}
  },1000);
}

function startBehavTimer(){
  if(behavTimerRunning) return;
  behavTimerRunning=true;
  document.getElementById('timerLabel').textContent='Sections 2 & 3: Behavioural';
  const m=Math.floor(behavSecs/60),s=behavSecs%60;
  document.getElementById('timerDisplay').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  behavTimer=setInterval(()=>{
    behavSecs--;
    updateTimer(behavSecs,'timerDisplay','timerBar');
    if(behavSecs<=0){clearInterval(behavTimer);document.getElementById('behavTimerOverlay').classList.remove('hidden');}
  },1000);
}

function updateTimer(secs,dispId,barId){
  const m=Math.floor(secs/60),s=secs%60;
  document.getElementById(dispId).textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  const bar=document.getElementById(barId);
  bar.classList.remove('warn','danger');
  if(secs<=120) bar.classList.add('danger');
  else if(secs<=300) bar.classList.add('warn');
}

function pauseFCSTimer(){clearInterval(fcsTimer);}
function pauseBehavTimer(){clearInterval(behavTimer);}

// ═══ NAVIGATION ═══════════════════════════════════════════
function startAssessment(){
  const ids=['fname','fmobile','fbranch','fdesig','fexp','fcountry'];
  if(ids.some(id=>!document.getElementById(id).value.trim())){
    document.getElementById('err0').style.display='block';return;
  }
  document.getElementById('err0').style.display='none';
  diamondType=document.getElementById('fdiamondtype').value||'natural';
  fcsBank=buildFCSBank(diamondType);
  document.getElementById('screen0').classList.add('hidden');
  document.getElementById('screen1').classList.remove('hidden');
  startFCSTimer();
  renderFCSQ(0);
}

function moveToBehav(){
  document.getElementById('fcsTimerOverlay').classList.add('hidden');
  pauseFCSTimer();
  document.getElementById('screen1').classList.add('hidden');
  document.getElementById('screenT12').classList.remove('hidden');
}

function startC2S(){
  document.getElementById('screenT12').classList.add('hidden');
  document.getElementById('screen1').classList.remove('hidden');
  startBehavTimer();
  renderBehavQ(0);
}

function startRSP(){
  document.getElementById('screenT23').classList.add('hidden');
  document.getElementById('screen1').classList.remove('hidden');
  renderBehavQ(C2S_COUNT);
}

function forceSubmit(){
  document.getElementById('behavTimerOverlay').classList.add('hidden');
  submitAll();
}

// ═══ RENDER QUESTIONS ════════════════════════════════════
function renderFCSQ(idx){
  fcsCurrentQ=idx;
  const q=fcsBank.questions[idx];
  const answered=fcsAnswers[idx];
  const pct=Math.round(((idx+1)/FCS_COUNT)*100);
  document.getElementById('qProgLabel').textContent='Knowledge: Q '+(idx+1)+' of '+FCS_COUNT;
  document.getElementById('qProgFill').style.width=pct+'%';
  const tagLabels={cut:'Cut',color:'Color',clarity:'Clarity',carat:'Carat',general:'General Knowledge'};
  const tagLabel=tagLabels[q.tag]||'Knowledge';
  document.getElementById('questionCard').innerHTML=`
    <div class="q-screen">
      <span class="q-badge fcs">Section 1 of 3 &#8212; Diamond Knowledge &#8212; ${tagLabel}</span>
      <div class="q-num">Question ${idx+1} of ${FCS_COUNT}</div>
      <div class="q-text">${q.q}</div>
      <div class="options">${q.opts.map((o,j)=>`
        <div class="opt${answered===j?' selected':''}" onclick="selectFCS(${j})">
          <div class="opt-letter">${String.fromCharCode(65+j)}</div>
          <div class="opt-text">${o.t}</div>
        </div>`).join('')}</div>
      <div class="nav-row">
        <button class="btn" onclick="goBackFCS()" ${idx===0?'disabled':''}>&larr; Back</button>
        <button class="btn btn-primary" id="nextBtn" onclick="goNextFCS()" ${answered===null?'disabled':''}>
          ${idx===FCS_COUNT-1?'Continue to Communication Style &rarr;':'Next &rarr;'}
        </button>
      </div>
    </div>`;
}

function selectFCS(opt){
  fcsAnswers[fcsCurrentQ]=opt;
  document.querySelectorAll('.opt').forEach((el,j)=>el.classList.toggle('selected',j===opt));
  document.getElementById('nextBtn').disabled=false;
}

function goNextFCS(){
  if(fcsAnswers[fcsCurrentQ]===null) return;
  if(fcsCurrentQ===FCS_COUNT-1){
    pauseFCSTimer();
    document.getElementById('screen1').classList.add('hidden');
    document.getElementById('screenT12').classList.remove('hidden');
    return;
  }
  renderFCSQ(fcsCurrentQ+1);
}

function goBackFCS(){
  if(fcsCurrentQ>0) renderFCSQ(fcsCurrentQ-1);
}

function renderBehavQ(idx){
  currentQ=idx;
  const isC2S=idx<C2S_COUNT;
  const q=isC2S?C2S_Q[idx]:RSP_Q[idx-C2S_COUNT];
  const answered=isC2S?c2sAnswers[idx]:rspAnswers[idx-C2S_COUNT];
  const qNum=idx+1;
  const pct=Math.round((qNum/TOTAL_BEHAV)*100);
  document.getElementById('qProgLabel').textContent='Behavioural: Q '+qNum+' of '+TOTAL_BEHAV;
  document.getElementById('qProgFill').style.width=pct+'%';
  const badge=isC2S?'<span class="q-badge c2s">Section 2 of 3 &#8212; Communication Style</span>':'<span class="q-badge rsp">Section 3 of 3 &#8212; Sales Persona</span>';
  const isLast=idx===TOTAL_BEHAV-1;
  document.getElementById('questionCard').innerHTML=`
    <div class="q-screen">
      ${badge}
      <div class="q-num">Question ${qNum} of ${TOTAL_BEHAV}</div>
      <div class="q-text">${isC2S?q.q:q.q}</div>
      <div class="options">${q.opts.map((o,j)=>`
        <div class="opt${answered===j?' selected':''}" onclick="selectBehav(${j})">
          <div class="opt-letter">${String.fromCharCode(65+j)}</div>
          <div class="opt-text">${typeof o==='string'?o:o}</div>
        </div>`).join('')}</div>
      <div class="nav-row">
        <button class="btn" onclick="goBackBehav()" ${idx===0?'disabled':''}>&larr; Back</button>
        <button class="btn btn-primary" id="nextBtn" onclick="goNextBehav()" ${answered===null?'disabled':''}>
          ${isLast?'Generate My Profile &rarr;':'Next &rarr;'}
        </button>
      </div>
    </div>`;
}

function selectBehav(opt){
  if(currentQ<C2S_COUNT) c2sAnswers[currentQ]=opt;
  else rspAnswers[currentQ-C2S_COUNT]=opt;
  document.querySelectorAll('.opt').forEach((el,j)=>el.classList.toggle('selected',j===opt));
  document.getElementById('nextBtn').disabled=false;
}

function goNextBehav(){
  const ans=currentQ<C2S_COUNT?c2sAnswers[currentQ]:rspAnswers[currentQ-C2S_COUNT];
  if(ans===null) return;
  if(currentQ===C2S_COUNT-1){
    document.getElementById('screen1').classList.add('hidden');
    document.getElementById('screenT23').classList.remove('hidden');
    return;
  }
  if(currentQ===TOTAL_BEHAV-1){pauseBehavTimer();submitAll();return;}
  renderBehavQ(currentQ+1);
}

function goBackBehav(){
  if(currentQ===0) return;
  renderBehavQ(currentQ-1);
}

// ═══ SVG RADAR ════════════════════════════════════════════
function radarSVG(values,colors,labels,maxVal,size){
  const n=values.length,cx=size/2,cy=size/2,r=size*0.38;
  const angle=(i)=>((i/n)*2*Math.PI)-Math.PI/2;
  const pt=(i,v)=>{const a=angle(i),d=(v/maxVal)*r;return[cx+d*Math.cos(a),cy+d*Math.sin(a)];};
  const gridPts=(pct)=>Array.from({length:n},(_,i)=>pt(i,maxVal*pct)).map(p=>p.join(',')).join(' ');
  const dataPath=values.map((v,i)=>pt(i,v)).map(p=>p.join(',')).join(' ');
  const spokes=Array.from({length:n},(_,i)=>{const[x,y]=pt(i,maxVal);return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>`;}). join('');
  const labelEls=labels.map((l,i)=>{
    const a=angle(i),d=r+18,x=cx+d*Math.cos(a),y=cy+d*Math.sin(a);
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="9" font-family="DM Sans,sans-serif" fill="#8A8070" font-weight="500">${l}</text>`;
  }).join('');
  const dots=values.map((v,i)=>{const[x,y]=pt(i,v);return `<circle cx="${x}" cy="${y}" r="3" fill="${colors[i]}"/>`;}). join('');
  return `<svg viewBox="0 0 ${size} ${size}" width="100%" style="max-width:${size}px">
    <polygon points="${gridPts(1)}" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="1"/>
    <polygon points="${gridPts(0.67)}" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="1"/>
    <polygon points="${gridPts(0.33)}" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="1"/>
    ${spokes}
    <polygon points="${dataPath}" fill="rgba(201,168,76,0.15)" stroke="#C9A84C" stroke-width="1.5"/>
    ${dots}
    ${labelEls}
  </svg>`;
}

// ═══ RESULTS ═════════════════════════════════════════════
function submitAll(){
  clearInterval(fcsTimer);clearInterval(behavTimer);
  sessionStorage.setItem(SESSION_KEY,'completed');

  const c2sRaw=scoreC2S(),rspResult=scoreRSP();
  const fcsResult=scoreFCS();
  const c2sA=analyseC2S(c2sRaw),rspA=analyseRSP(rspResult);
  const comboKey=C2S_NAMES[c2sA.primary]+'-'+rspA.stage.key;
  const profile=PROFILES_20[comboKey]||PROFILES_20['Amiable-PS'];
  const fcsPct=Math.round((fcsResult.correct/25)*100);
  const fcsGrade=getFCSGrade(fcsPct);
  const readiness=getReadiness(c2sA,rspA,fcsResult.correct);
  const readinessBand=getReadinessBand(readiness.total);
  const fname=document.getElementById('fname').value;
  const now=new Date();
  const refId='IGI-'+now.getFullYear().toString().slice(2)+String(now.getMonth()+1).padStart(2,'0')+'-'+String(Math.floor(Math.random()*9000+1000));
  const dateStr=now.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
  const behavUsed=BEHAV_SECS-behavSecs,fcsUsed=FCS_SECS-fcsSecs;
  const timeTaken='4Cs: '+Math.floor(fcsUsed/60)+'m '+fcsUsed%60+'s | Behav: '+Math.floor(behavUsed/60)+'m '+behavUsed%60+'s';
  const dtLabel={natural:'Natural Diamonds',lgd:'Lab Grown Diamonds',both:'Both'}[diamondType]||diamondType;

  // C2S radar
  const c2sVals=[c2sRaw[1],c2sRaw[2],c2sRaw[3],c2sRaw[4]];
  const c2sColors=[C2S_COLORS[1],C2S_COLORS[2],C2S_COLORS[3],C2S_COLORS[4]];
  const c2sLabels=['Analytical','Amiable','Expressive','Driver'];
  const c2sSVG=radarSVG(c2sVals,c2sColors,c2sLabels,24,160);

  // RSP now uses maturity score display — no radar needed
  const rspSVG='';

  // RSP ladder
  const ladderOrder=['H','F','C','A'];
  const ladderHTML=`
    <div class="ladder-card">
      <div class="ladder-title">&#8594; Sales Persona Progression Ladder</div>
      <div style="position:relative">
        <div class="ladder-line"></div>
        <div class="ladder-steps">
          ${ladderOrder.map(k=>{
            const d=RSP_DISPLAY[k];
            const isCurrent=k===rspA.primary;
            const isSecondary=k===rspA.secondary&&rspA.classification!=='Defined';
            const dotClass=isCurrent?'current':isSecondary?'secondary':'';
            return `<div class="ladder-step">
              <div class="ls-dot ${dotClass}">${isCurrent?'&#9733;':isSecondary?'&#9672;':'&#9679;'}</div>
              <div class="ls-name ${isCurrent?'current':''}">${d.name}</div>
              <div class="ls-tag">(${d.sub})</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="ladder-narrative">
        <strong style="color:var(--gold)">${fname}&apos;s current position:</strong> ${rspA.label}
        ${rspA.blendNarrative?`<div class="blend-panel"><div class="blend-label">Blend insight</div>${rspA.blendNarrative}</div>`:''}
      </div>
    </div>`;

  // 4Cs breakdown
  const catConfig={
    cut:{label:'Cut',color:'#534AB7',icon:'✂'},
    color:{label:'Color',color:'#378ADD',icon:'🎨'},
    clarity:{label:'Clarity',color:'#1D9E75',icon:'🔍'},
    carat:{label:'Carat',color:'#C9A84C',icon:'⚖'},
    general:{label:'General 4Cs',color:'#8A8070',icon:'💎'}
  };
  const fcsBreakdownHTML=Object.entries(fcsResult.tagScores).map(([tag,s])=>{
    const cfg=catConfig[tag]||{label:tag,color:'#8A8070',icon:'◆'};
    const pct=s.total>0?Math.round((s.correct/s.total)*100):0;
    const flagColor=pct<56?'#C94A4A':pct<76?'#C9A84C':'#1D9E75';
    return `<div class="fcs-cat-row">
      <div class="fcs-cat-header">
        <span class="fcs-cat-name">${cfg.icon} ${cfg.label}</span>
        <span class="fcs-cat-score" style="color:${flagColor}">${s.correct}/${s.total} (${pct}%)</span>
      </div>
      <div class="fcs-cat-track"><div class="fcs-cat-fill" style="width:${pct}%;background:${cfg.color}"></div></div>
      ${pct<56?'<div style="font-size:10px;color:#C94A4A;margin-top:3px">&#9888; Focus area — training recommended</div>':''}
    </div>`;
  }).join('');

  // IDP
  const idpHTML=profile.idp&&profile.idp.length?`
    <div class="idp-card">
      <h3>&#128203; Individual Development Plan &mdash; ${fname}</h3>
      <p style="font-size:12px;color:var(--muted);margin-bottom:16px">Based on your ${c2sA.label} + ${rspA.label} profile. Use the 70-20-10 model: 70% on-the-job, 20% from others, 10% formal learning.</p>
      ${profile.idp.map(area=>`
        <div class="idp-area">
          <div class="idp-area-title">&#9632; ${area.area}</div>
          <div class="idp-gap">Gap identified: ${area.gap}</div>
          <div class="idp-actions">
            <div class="idp-action"><span class="idp-action-badge badge-70">70%</span><span>${area.action70}</span></div>
            <div class="idp-action"><span class="idp-action-badge badge-20">20%</span><span>${area.action20}</span></div>
            <div class="idp-action"><span class="idp-action-badge badge-10">10%</span><span>${area.action10}</span></div>
          </div>
        </div>`).join('')}
    </div>`:'';

  const html=`
    <div class="result-hero">
      <div class="gem">&#128142;</div>
      <div class="assoc-name">${fname}</div>
      <div class="assoc-meta">${document.getElementById('fdesig').value} &bull; ${document.getElementById('fbranch').value}${document.getElementById('fbatch').value?' &bull; '+document.getElementById('fbatch').value:''}</div>
      <div class="combo-badge">${c2sA.label} &bull; ${rspA.label}</div>
    </div>

    <div class="readiness-card">
      <div class="ri-label">IGI Retail Sales Excellence Index</div>
      <div><span class="ri-score">${readiness.total}</span><span class="ri-max">/100</span></div>
      <div class="ri-band" style="color:${readinessBand.color}">${readinessBand.label}</div>
      <div class="ri-track"><div class="ri-fill" style="width:${readiness.total}%;background:${readinessBand.color}"></div></div>
      <div class="ri-panels">
        <div class="ri-panel">
          <div class="ri-panel-label" style="color:var(--purple)">Diamond Knowledge</div>
          <div class="ri-pct" style="color:var(--purple)">${fcsPct}%</div>
          <div class="ri-raw">${fcsResult.correct} / 25 correct</div>
          ${fcsGrade.flag
            ?'<div class="flag-box">&#9888; Technical Training Recommended</div>'
            :'<div class="ri-grade" style="background:var(--off);color:'+fcsGrade.color+'">'+fcsGrade.label+'</div>'
          }
        </div>
        <div class="ri-divider"></div>
        <div class="ri-panel">
          <div class="ri-panel-label" style="color:var(--muted)">Behavioural Profile</div>
          <div style="margin-top:8px">
            <div class="clarity-row"><span style="color:var(--muted)">Communication</span><span class="clarity-pill" style="color:${C2S_COLORS[c2sA.primary]}">${readiness.c2sClarityLabel}</span></div>
            <div class="clarity-row"><span style="color:var(--muted)">Sales Persona</span><span class="clarity-pill" style="color:${RSP_DISPLAY[rspA.primary].color}">${readiness.rspClarityLabel}</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="radar-wrap">
      <div class="radar-card">
        <div class="sp-label" style="color:var(--teal)">Communication Style</div>
        ${c2sSVG}
        <div class="profile-classification" style="background:${C2S_COLORS[c2sA.primary]}22;color:${C2S_COLORS[c2sA.primary]}">${c2sA.label}</div>
        ${c2sA.blendNarrative?'<div class="blend-panel" style="background:var(--off);color:var(--navy);margin-top:10px"><div class="blend-label" style="color:var(--purple)">Blend insight</div>'+c2sA.blendNarrative+'</div>':''}
      </div>
      <div class="radar-card">
        <div class="sp-label" style="color:var(--coral)">Sales Persona</div>
        ${rspSVG}
        <div class="profile-classification" style="background:${RSP_DISPLAY[rspA.primary].color}22;color:${RSP_DISPLAY[rspA.primary].color}">${rspA.label}</div>
      </div>
    </div>

    ${ladderHTML}

    <div class="fcs-card">
      <div class="fcs-title">Diamond Knowledge Breakdown &mdash; ${dtLabel}</div>
      ${fcsBreakdownHTML}
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);display:flex;justify-content:space-between;font-size:12px">
        <span style="color:var(--muted)">Overall score</span>
        <span style="font-weight:600;color:${fcsGrade.color}">${fcsResult.correct}/25 (${fcsPct}%)</span>
      </div>
    </div>

    <div class="insight-panel">
      <div class="ip-tag">Coaching insight &mdash; ${fname}</div>
      <div class="ip-title">${profile.title}</div>
      <div class="ip-body">${profile.body}</div>
    </div>

    <div class="strength-card">
      <h3 style="color:var(--teal)">&#10003; ${fname}&apos;s natural strengths</h3>
      ${profile.strengths.map(s=>'<div class="si"><div class="si-dot dot-teal"></div><div>'+s+'</div></div>').join('')}
    </div>

    <div class="strength-card">
      <h3 style="color:var(--coral)">&#9675; Watch out for</h3>
      ${profile.watchouts.map(w=>'<div class="si"><div class="si-dot dot-coral"></div><div>'+w+'</div></div>').join('')}
    </div>

    <div class="strength-card">
      <h3 style="color:var(--purple)">&#9632; Customer types to focus on</h3>
      <div class="si"><div class="si-dot dot-purple"></div><div>${profile.customers}</div></div>
    </div>

    <div class="ideal-moment">
      <strong>&#9733; ${fname}&apos;s ideal sales moment</strong>
      ${profile.moment}
    </div>

    <div class="focus-grid">
      <div class="focus-pill"><div class="fp-icon">&#127919;</div><div class="fp-val">${profile.focus1}</div><div class="fp-sub">${profile.f1sub}</div></div>
      <div class="focus-pill"><div class="fp-icon">&#128161;</div><div class="fp-val">${profile.focus2}</div><div class="fp-sub">${profile.f2sub}</div></div>
    </div>

    ${idpHTML}

    <div class="trainer-note">
      <div class="tn-tag">&#128274; Trainer & Manager Notes &mdash; ${fname}</div>
      <div class="tn-body">${profile.trainerNote}</div>
      <div class="tn-grid">
        <div class="tn-item"><div class="tn-lbl">C2S Profile</div><div class="tn-val">${c2sA.label} (${c2sA.classification})</div></div>
        <div class="tn-item"><div class="tn-lbl">RSP Profile</div><div class="tn-val">${rspA.label} (${rspA.classification})</div></div>
        <div class="tn-item"><div class="tn-lbl">Excellence Index</div><div class="tn-val">${readiness.total}/100 &mdash; ${readinessBand.label}</div></div>
        <div class="tn-item"><div class="tn-lbl">4Cs Score</div><div class="tn-val">${fcsPct}% (${fcsResult.correct}/25) ${fcsGrade.flag?'&#9888; Training needed':''}</div></div>
        <div class="tn-item"><div class="tn-lbl">Diamond Type</div><div class="tn-val">${dtLabel}</div></div>
        <div class="tn-item"><div class="tn-lbl">Trainer</div><div class="tn-val">${TRAINER||'Not specified'}</div></div>
        <div class="tn-item"><div class="tn-lbl">Batch</div><div class="tn-val">${document.getElementById('fbatch').value||'Not specified'}</div></div>
        <div class="tn-item" style="grid-column:1/-1"><div class="tn-lbl">Time taken</div><div class="tn-val">${timeTaken}</div></div>
      </div>
    </div>

    <div class="strength-card">
      <div class="ref-row">
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:2px">Ref ID</div><div class="ref-id">${refId}</div></div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:2px">Assessed on</div><div style="font-size:12px;color:var(--muted)">${dateStr}</div></div>
        <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
      </div>
    </div>
    <div class="footer-note">IGI School of Gemology &mdash; Retail Sales Excellence Program</div>`;

  document.getElementById('screen1').classList.add('hidden');
  document.getElementById('timerBar').classList.add('hidden');
  const s3=document.getElementById('screen3');
  s3.classList.remove('hidden');
  s3.innerHTML=html;

  // Log to sheet
  const payload={
    timestamp:now.toISOString(),refId,
    trainerName:TRAINER,batchCode:document.getElementById('fbatch').value,
    igiCentre:CENTRE,clientParam:CLIENT,
    name:fname,mobile:document.getElementById('fmobile').value,
    branch:document.getElementById('fbranch').value,
    designation:document.getElementById('fdesig').value,
    experience:document.getElementById('fexp').value,
    country:document.getElementById('fcountry').value,
    diamondType:dtLabel,timeTaken,
    c2sPrimary:C2S_NAMES[c2sA.primary],c2sClassification:c2sA.classification,
    c2sLabel:c2sA.label,c2sScores:JSON.stringify(c2sRaw),
    rspScore:rspA.avg,rspStage:rspA.stage.label,rspStageKey:rspA.stage.key,
    rspLabel:rspA.label,
    fcsScore:fcsResult.correct,fcsPct,fcsGrade:fcsGrade.label,
    fcsTagScores:JSON.stringify(fcsResult.tagScores),
    readinessTotal:readiness.total,readinessBand:readinessBand.label,
    knowledgePts:readiness.knowledgePts,behaviouralPts:readiness.behaviouralPts,
    comboProfile:comboKey,insightTitle:profile.title
  };
  if(SHEET_URL) fetch(SHEET_URL,{method:'POST',mode:'no-cors',body:JSON.stringify(payload)}).catch(()=>{});
}
