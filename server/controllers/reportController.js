const Report = require('../models/Report');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// 1. Create Report with Sightengine AI
exports.createReport = async (req, res) => {
    try {
        const { animalType, description, location } = req.body;
        const parsedLocation = JSON.parse(location);
        const photoUrl = req.file ? `/uploads/${req.file.filename}` : '';

        let aiPriority = 5;
        let aiAnalysis = "Awaiting AI verification...";

        if (req.file) {
            const imagePath = req.file.path;

            // 🩸 SIGHTENGINE (Injury Detection)
            const sightData = new FormData();
            sightData.append('media', fs.createReadStream(imagePath));
            sightData.append('models', 'gore');
            sightData.append('api_user', process.env.SIGHTENGINE_USER);
            sightData.append('api_secret', process.env.SIGHTENGINE_SECRET);

            const sightRes = await axios.post('https://api.sightengine.com/1.0/check.json', sightData, {
                headers: sightData.getHeaders()
            });

            const goreScore = sightRes.data.gore.prob;
            
            if (goreScore > 0.4) {
                aiPriority = 10;
                aiAnalysis = `🚨 CRITICAL: Injury detected (${(goreScore * 100).toFixed(0)}% confidence).`;
            } else {
                aiPriority = 7;
                aiAnalysis = `✅ STABLE: Animal appears physically fine.`;
            }
        }

        const newReport = await Report.create({
            animalType, description, location: parsedLocation, photoUrl,
            status: 'Pending', priority: aiPriority, aiSummary: aiAnalysis
        });

        res.status(201).json({ message: 'AI Analysis Complete!', report: newReport });
    } catch (error) {
        console.error("AI Error:", error.message);
        res.status(500).json({ message: 'AI Analysis failed' });
    }
};

// 2. ✨ AI First-Aid Chat Gateway (Keyword-first + Gemini fallback)
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 🗂️ KEYWORD RESPONSE DATABASE — instant, reliable answers
const KEYWORD_RESPONSES = [
    {
        keywords: ['bleeding', 'blood', 'wound', 'cut', 'gash', 'laceration'],
        reply: "🩸 **Bleeding First-Aid:**\n• Apply firm pressure with a clean cloth or gauze — do NOT remove it even if it soaks through, just add more layers.\n• If the wound is on a limb, try to keep it elevated above the heart.\n• Do NOT use a tourniquet unless you're trained. Get the animal to a vet ASAP."
    },
    {
        keywords: ['fracture', 'broken bone', 'limping', 'limp', 'leg injury', "can't walk", 'cant walk'],
        reply: "🦴 **Suspected Fracture:**\n• Do NOT try to realign the bone — this can cause more damage.\n• Restrict the animal's movement by gently placing it on a flat, rigid surface (like cardboard).\n• If a limb is hanging loosely, you can lightly splint it with a rolled newspaper and tape.\n• Keep the animal calm and warm while you wait for rescue."
    },
    {
        keywords: ['choking', 'not breathing', 'suffocating', 'gasping', 'airway blocked'],
        reply: "🫁 **Breathing Emergency:**\n• If choking, gently open the mouth and check for visible obstructions — remove only if you can safely grasp it.\n• For small animals, hold them upside down briefly and give 5 firm back blows.\n• If the animal has stopped breathing, lay it on its side, extend the neck, and give 2 rescue breaths through the nose with the mouth closed.\n• Rush to a vet immediately."
    },
    {
        keywords: ['poison', 'poisoning', 'toxic', 'ate something', 'vomiting', 'vomit', 'chemical', 'rat poison', 'antifreeze', 'chocolate', 'ate', 'swallowed', 'stomach', 'ingested'],
        reply: "☠️ **Poisoning / Toxic Ingestion Alert:**\n• Do NOT induce vomiting unless a vet specifically instructs you to.\n• Try to identify what the animal ingested — take a photo of the substance/packaging.\n• If it ate chocolate: darker chocolate = more dangerous. Small amounts of milk chocolate are less toxic, but dark/baker's chocolate is an emergency.\n• If it's a skin contact poison, wash the area with lukewarm water for 10 minutes.\n• Call a vet or animal poison helpline immediately. Time is critical."
    },
    {
        keywords: ['burn', 'burned', 'scalded', 'hot water', 'acid burn'],
        reply: "🔥 **Burn Care:**\n• Run cool (NOT ice-cold) water over the burned area for at least 10 minutes.\n• Do NOT apply butter, toothpaste, or any home remedies.\n• Cover the area loosely with a clean, damp cloth.\n• If the burn is large or deep, keep the animal warm and get to a vet immediately."
    },
    {
        keywords: ['seizure', 'convulsion', 'fitting', 'epilepsy'],
        reply: "⚡ **Seizure Response:**\n• Do NOT hold the animal down or put anything in its mouth.\n• Clear the area of sharp objects and furniture to prevent injury.\n• Time the seizure — if it lasts more than 2-3 minutes, it's an emergency.\n• After the seizure stops, keep the animal in a quiet, dark room and contact a vet."
    },
    {
        keywords: ['heatstroke', 'overheating', 'dehydrated', 'dehydration'],
        reply: "🌡️ **Heatstroke Emergency:**\n• Move the animal to a shaded, cool area immediately.\n• Apply cool (NOT cold) water to the paws, belly, and ears.\n• Offer small sips of water — do NOT force them to drink.\n• Fan the animal and get to a vet — heatstroke can be fatal within minutes."
    },
    {
        keywords: ['drowning', 'submerged', 'fell in water'],
        reply: "🌊 **Drowning Rescue:**\n• Hold the animal upside down (small animals) or tilt head-down to drain water from the lungs.\n• Clear the mouth and nose of debris.\n• If not breathing, perform rescue breaths through the nose while keeping the mouth shut.\n• Even if the animal seems fine after, ALWAYS see a vet — secondary drowning can occur hours later."
    },
    {
        keywords: ['snake bite', 'bitten by snake', 'fang', 'venom'],
        reply: "🐍 **Snake/Bite Wound:**\n• Keep the animal as still and calm as possible — movement spreads venom faster.\n• Do NOT try to suck out venom, cut the wound, or apply a tourniquet.\n• If you saw the snake, try to remember its color and pattern (or take a photo).\n• Carry the animal (don't let it walk) and rush to the nearest vet."
    },
    {
        keywords: ['stuck', 'trapped', 'caught in fence', 'fell in hole', 'stuck in drain', 'stuck in tree'],
        reply: "🔒 **Trapped Animal:**\n• Assess the situation before acting — panicked animals may bite.\n• If the animal is stuck in wire/fence, try to cut the material, NOT pull the animal.\n• For animals in drains/holes, try luring them out with food or water.\n• If you cannot safely free the animal, stay nearby and wait for our rescue team."
    },
    {
        keywords: ['newborn', 'puppy', 'kitten', 'orphan', 'abandoned baby', 'infant animal'],
        reply: "🍼 **Newborn/Baby Animal Care:**\n• Keep the baby warm — wrap in a soft cloth and place near a warm (not hot) water bottle.\n• Do NOT feed cow's milk — it causes diarrhea. Use special animal formula or warm sugar water as a temporary substitute.\n• If you found a baby bird, place it back in the nest if possible.\n• Contact a wildlife rehabilitator or vet — baby animals need specialized care."
    },
    {
        keywords: ['eye injury', 'swollen eye', 'eye discharge', 'eye bleeding'],
        reply: "👁️ **Eye Injury:**\n• Do NOT touch or rub the eye.\n• Gently flush with clean, lukewarm water or saline solution.\n• If an object is embedded in the eye, do NOT attempt to remove it.\n• Cover the eye loosely with a damp cloth and see a vet urgently."
    },
    {
        keywords: ['hit by car', 'accident', 'run over', 'vehicle hit', 'collision'],
        reply: "🚗 **Vehicle Accident:**\n• Approach carefully — injured animals may bite out of pain and fear.\n• Do NOT move the animal unless it's in immediate danger (on the road).\n• Slide a flat board or blanket under the animal to use as a stretcher.\n• Keep the animal warm and still. Internal injuries are common even if the animal looks okay externally. Rush to a vet."
    },
    {
        keywords: ['tick', 'flea', 'parasite', 'mange', 'fur loss', 'scratching a lot'],
        reply: "🪲 **Parasite/Skin Issue:**\n• For ticks, use fine-tipped tweezers and pull straight out without twisting. Don't squeeze the body.\n• Do NOT apply oil, vaseline, or heat to attached ticks.\n• For mange or severe fur loss, the animal needs prescribed medication from a vet.\n• Keep the animal isolated from other pets until diagnosed."
    }
];

// 🎯 Greeting patterns — only match on SHORT messages (not inside real emergencies)
const GREETING_KEYWORDS = ['hello', 'hi', 'hey', 'what can you do', 'who are you'];
const GREETING_REPLY = "🐾 **Hey there! I'm your PawPatrol AI Rescue Assistant.**\n\nI can help you with:\n• 🩸 Bleeding & wound care\n• 🦴 Fractures & mobility issues\n• ☠️ Poisoning emergencies\n• 🌡️ Heatstroke & dehydration\n• 🐍 Snake bites & animal bites\n• 🍼 Baby/orphan animal care\n• 🚗 Road accident first-aid\n\nJust describe what happened and I'll guide you! 🚑";

// 🧠 Smart word-boundary matcher — prevents "behind" matching "hi"
const matchesKeyword = (msg, keyword) => {
    // Multi-word phrases: use simple includes (they're specific enough)
    if (keyword.includes(' ')) return msg.includes(keyword);
    // Single words: use word-boundary regex so "hi" won't match "behind"
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(msg);
};

exports.chatFirstAid = async (req, res) => {
    try {
        const { message } = req.body;
        const lowerMsg = message.toLowerCase().trim();
        const wordCount = lowerMsg.split(/\s+/).length;

        // Short greetings — answer instantly without hitting the API
        if (wordCount <= 5) {
            const isGreeting = GREETING_KEYWORDS.some(kw => matchesKeyword(lowerMsg, kw));
            if (isGreeting) {
                return res.status(200).json({ reply: GREETING_REPLY });
            }
        }

        // 🤖 PRIMARY: Try Gemini AI with retry + model fallback
        if (process.env.GEMINI_API_KEY) {
            const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro'];
            const SYSTEM_PROMPT = `You are PawPatrol AI — a highly skilled veterinary emergency first-aid assistant embedded in an animal rescue app.

YOUR ROLE:
- You are the user's FIRST responder before professional help arrives
- Think and respond like an emergency veterinary doctor
- Give specific, actionable, step-by-step first-aid instructions
- Be confident but compassionate — the user is likely panicked

RESPONSE RULES:
1. ALWAYS provide concrete first-aid steps, not vague advice
2. Use numbered steps for clarity (1. Do this 2. Then this)
3. Include what NOT to do (common mistakes that worsen injuries)
4. Mention urgency level: CRITICAL (rush to vet), URGENT (vet within hours), STABLE (monitor)
5. Keep responses focused and practical (under 200 words)
6. Use simple language — the user may not be medically trained
7. If the situation sounds life-threatening, emphasize calling emergency animal services
8. You can answer questions about animal behavior, nutrition, and general care too
9. If asked something completely unrelated to animals, politely redirect to animal rescue topics
10. Use emojis sparingly to make the response friendly but professional

IMPORTANT: You must ALWAYS try to help. Never say "I don't know" — always provide at least general stabilization steps.`;

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

            for (const modelName of MODELS) {
                for (let attempt = 0; attempt < 2; attempt++) {
                    try {
                        if (attempt > 0) await new Promise(r => setTimeout(r, 3000));
                        const model = genAI.getGenerativeModel({ model: modelName });
                        const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nUser's question: ${message}\n\nProvide your emergency first-aid response:`);
                        const reply = result.response.text();
                        if (reply && reply.trim()) {
                            return res.status(200).json({ reply: reply.trim() });
                        }
                    } catch (err) {
                        console.error(`Gemini [${modelName}] attempt ${attempt + 1}:`, err.message?.substring(0, 100));
                        if (!err.message?.includes('retry') && !err.message?.includes('429') && !err.message?.includes('RESOURCE_EXHAUSTED')) break;
                    }
                }
            }
            console.error('All Gemini models/retries exhausted, using keyword fallback');
        }

        // FALLBACK: Keyword database if AI fails
        for (const entry of KEYWORD_RESPONSES) {
            const matched = entry.keywords.some(kw => matchesKeyword(lowerMsg, kw));
            if (matched) {
                return res.status(200).json({ reply: entry.reply });
            }
        }

        // Last resort
        res.status(200).json({ 
            reply: "🐾 I couldn't process that right now. Try describing the animal's symptoms in detail (e.g., 'dog is bleeding from its leg' or 'cat ate something toxic') and I'll give you specific first-aid steps!" 
        });
    } catch (error) {
        console.error("Chat Error:", error.message);
        res.status(200).json({ 
            reply: "🐾 I'm having a connection issue. In the meantime — keep the animal calm and still in a quiet, warm place. Don't give food or water unless you're sure it's safe. Our rescue team is on the way!" 
        });
    }
};

// 3. Get all reports (Prevents Dashboard Crash)
exports.getAllReports = async (req, res) => {
    try {
        const reports = await Report.find({ status: { $ne: 'Resolved' } })
                                    .sort({ priority: -1, createdAt: -1 });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch reports' });
    }
};

// 3a. Get resolved reports (Rescue History)
exports.getResolvedReports = async (req, res) => {
    try {
        const reports = await Report.find({ status: 'Resolved' })
                                    .sort({ createdAt: -1 })
                                    .limit(50);
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch history' });
    }
};

// 3b. Get single report by ID (for reporter status polling)
exports.getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });
        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch report' });
    }
};

// 4. Update report status
exports.updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updatedReport = await Report.findByIdAndUpdate(id, { status }, { new: true });
        res.status(200).json(updatedReport);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update status' });
    }
};

// 5. Add follow-up report to a resolved case
exports.addFollowUp = async (req, res) => {
    try {
        const { id } = req.params;
        const { followUpReport } = req.body;
        const updatedReport = await Report.findByIdAndUpdate(
            id, 
            { followUpReport }, 
            { new: true }
        );
        if (!updatedReport) return res.status(404).json({ message: 'Report not found' });
        res.status(200).json(updatedReport);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add follow-up' });
    }
};