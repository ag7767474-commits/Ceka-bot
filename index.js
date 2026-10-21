const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

// رقم المطور والمالك الأساسي
const OWNER_PHONE = "201061892440"; 
const BOT_PHONE = "201061991259";

let isPublicMode = true; // مفعل للجميع في الخاص والجروبات

function normalizeText(text) {
    if (!text) return "";
    return text
        .trim()
        .toLowerCase()
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064b-\u065f]/g, '');
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(BOT_PHONE);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n========================================`);
                console.log(`🔑 كود الاقتران الخاص برقم البوت هو: ${code}`);
                console.log(`========================================\n`);
            } catch (error) {
                console.error("خطأ أثناء توليد كود الاقتران:", error);
            }
        }, 4000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('🤖 ꧁༺ 𝒟𝒜𝑅𝒦 𝒮𝐻𝒜𝒟𝒪𝒲 ༻꧂ البوت يعمل الآن بكامل الكفاءة!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const remoteJid = m.key.remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');
        
        const senderJid = isGroup ? (m.key.participant || m.participant) : remoteJid;
        const cleanSender = (senderJid || "").replace(/\D/g, '');
        
        // التحقق الذكي والمضمون لمطابقة رقم المطور (بمقارنة آخر 10 أرقام)
        const isOwner = cleanSender.slice(-10) === OWNER_PHONE.slice(-10);

        const messageText = m.message.conversation || m.message.extendedTextMessage?.text || "";
        const cleanText = normalizeText(messageText);

        if (!cleanText) return;

        // القائمة الشاملة
        const menuKeywords = ["اوامر", "قائمه", "قائمة", "الاوامر", "menu", "list"];
        if (menuKeywords.includes(cleanText)) {
            const menuText = `꧁༺ 𝒟𝒜𝑅𝒦 𝒮𝐻𝒜𝒟𝒪𝒲 ༻꧂\n\n` +
                `🕸️ *القائمة الشاملة والأوامر:* \n\n` +
                `👑 *أوامر الإدارة والإشراف:* \n` +
                `• تست ➔ اختبار سرعة البوت\n` +
                `• المطور ➔ عرض المطور\n` +
                `• عام / خاص ➔ فتح/قفل البوت\n` +
                `• قفل / فتح ➔ قفل أو فتح الشات\n\n` +
                `📌 *أوامر الحب والتسلية:* \n` +
                `• حب، غزل، دلع، مجاملة، ترحيب\n` +
                `• بودا، بم، بح، مدح، ذم، صفة\n\n` +
                `🎮 *أوامر الألعاب:* \n` +
                `• لو خيروك، نسبة حب، حجرة، رياضيات\n` +
                `• تفكيك، ركب، عواصم، خمن، صح\n\n` +
                `🛠️ *الخدمات:* \n` +
                `• حسبة [معادلة]\n` +
                `• ذكاء / ai`;
            return sock.sendMessage(remoteJid, { text: menuText });
        }

        // أوامر التحكم
        if (cleanText === "mode_public" || cleanText === "عام") {
            if (!isOwner) return sock.sendMessage(remoteJid, { text: "⚠️ عذراً، هذا الأمر للمطور فقط!" });
            isPublicMode = true;
            return sock.sendMessage(remoteJid, { text: "🔓 تم فتح البوت للجميع." });
        }

        if (cleanText === "mode_admin" || cleanText === "خاص") {
            if (!isOwner) return sock.sendMessage(remoteJid, { text: "⚠️ عذراً، هذا الأمر للمطور فقط!" });
            isPublicMode = false;
            return sock.sendMessage(remoteJid, { text: "🔒 تم قفل البوت (أوامر الإدارة حصرياً للمطور)." });
        }

        const adminCommands = ["تست", "المطور", "ادمن اضافة", "ادمن ازالة", "قفل", "فتح", "انذار", "طرد", "منشن", "رابط", "حذف", "كتم", "فك"];
        const isCmdAdmin = adminCommands.some(cmd => cleanText.startsWith(normalizeText(cmd)));

        if (isCmdAdmin && !isOwner) {
            return sock.sendMessage(remoteJid, { text: "⛔ هذا الأمر خاص بأدمن البوت والمطور فقط." });
        }

        if (!isOwner && !isPublicMode) return;

        // تنفيذ الأوامر
        switch(true) {
            case cleanText === "تست":
                return sock.sendMessage(remoteJid, { text: "⚡ البوت يعمل بأقصى سرعة وكفاءة معك يا مطورنا!" });
            case cleanText === "المطور":
                return sock.sendMessage(remoteJid, { text: "👑 مطور البوت:\n꧁༺ 𝒟𝒜𝑅𝒦 𝒮𝐻𝒜𝒟𝒪𝒲 ༻꧂\nرقم المطور: wa.me/" + OWNER_PHONE });
            case cleanText === "قفل":
                return sock.sendMessage(remoteJid, { text: "🔒 تم قفل الشات بنجاح." });
            case cleanText === "فتح":
                return sock.sendMessage(remoteJid, { text: "🔓 تم فتح الشات للجميع." });

            case cleanText === "ترحيب":
                return sock.sendMessage(remoteJid, { text: "🔥 أهلاً وسهلاً بالجميع في عالم 𝒟𝒜𝑅𝒦 𝒮𝐻𝒜𝒟𝒪𝒲 الفخم!" });
            case cleanText === "حب":
                return sock.sendMessage(remoteJid, { text: "❤️ الحب الحقيقي يبدأ بالبرمجة وينتهي بالإبداع!" });
            case cleanText === "غزل":
                return sock.sendMessage(remoteJid, { text: "🔥 يا جميل الملامح، إيه العظمة دي كلها!" });
            case cleanText === "دلع":
                return sock.sendMessage(remoteJid, { text: "🌸 أرق الكلمات وأفخم دلع لأحلى عضو." });
            case cleanText === "مجاملة" || cleanText === "مجامله":
                return sock.sendMessage(remoteJid, { text: "✨ طلتك منورة المكان كله، إيه الحلاوة دي!" });
            case cleanText === "بودا":
                return sock.sendMessage(remoteJid, { text: "🤖 أنا خادم المطور المطيع تحت أمرك دائماً." });
            case cleanText === "بم":
                return sock.sendMessage(remoteJid, { text: "😍 بموت في الضحكة دي!" });
            case cleanText === "بح":
                return sock.sendMessage(remoteJid, { text: "💌 رسالة حب متنوعة ومميزة لك!" });
            case cleanText === "مدح":
                return sock.sendMessage(remoteJid, { text: "🌟 أنت القمة والأسطورة التي لا تتكرر!" });
            case cleanText === "ذم":
                return sock.sendMessage(remoteJid, { text: "🤪 كفاية تسليك وتعال افهم صح!" });
            case cleanText === "صفة" || cleanText === "صفه":
                const traits = ["الذكاء الحاد 🧠", "الطيبة الزائدة 🤍", "الكرم 🎁", "الروقان والكوميديا 😄"];
                return sock.sendMessage(remoteJid, { text: `🎯 صفتك العشوائية: ${traits[Math.floor(Math.random() * traits.length)]}` });

            case cleanText.startsWith("نسبة حب") || cleanText.startsWith("نسبه حب"):
                return sock.sendMessage(remoteJid, { text: `💖 نسبة الحب: ${Math.floor(Math.random() * 101)}%` });
            case cleanText === "لو خيروك" || cleanText === "لو_خيروك":
                return sock.sendMessage(remoteJid, { text: "🤔 لو خيروك: السفر للمستقبل 🚀 أم العودة للماضي ⏳؟" });
            case cleanText === "حجرة" || cleanText === "حجره":
                const choices = ["حجرة 🪨", "ورقة 📄", "مقص ✂️"];
                return sock.sendMessage(remoteJid, { text: `🎮 اخترت: ${choices[Math.floor(Math.random() * choices.length)]}` });
            case cleanText === "صح":
                return sock.sendMessage(remoteJid, { text: "❓ هل الأرض دائرية الشكل؟ (صح / غلط)" });
            case cleanText === "تفكيك":
                return sock.sendMessage(remoteJid, { text: "🧩 فكك الكلمة التالية: ( ق - ه - ر - ه )" });
            case cleanText === "ركب":
                return sock.sendMessage(remoteJid, { text: "🧩 ركب الأحرف التالية لتكوين كلمة: ( ب / و / ت )" });
            case cleanText === "سؤال":
                return sock.sendMessage(remoteJid, { text: "💬 سؤال صراحة: ما هي أكثر صفة تحبها في نفسك؟" });
            case cleanText === "رياضيات":
                const n1 = Math.floor(Math.random() * 15) + 1;
                const n2 = Math.floor(Math.random() * 15) + 1;
                return sock.sendMessage(remoteJid, { text: `🔢 مسابقة حسابية: كم الناتج؟\n${n1} × ${n2} = ؟` });
            case cleanText === "عواصم":
                return sock.sendMessage(remoteJid, { text: "🌍 ما هي عاصمة دولة فرنسا؟" });
            case cleanText === "خمن":
                return sock.sendMessage(remoteJid, { text: `🔢 خمن رقم من 1 إلى 10!` });

            case cleanText.startsWith("حسبة ") || cleanText.startsWith("حسبه "):
                try {
                    const expr = cleanText.replace(/حسبة|حسبه/g, "").trim();
                    return sock.sendMessage(remoteJid, { text: `🧮 النتيجة = ${eval(expr)}` });
                } catch {
                    return sock.sendMessage(remoteJid, { text: "❌ صيغة المعادلة غير صحيحة." });
                }
            case cleanText === "ai" || cleanText === "ذكاء":
                return sock.sendMessage(remoteJid, { text: "🤖 أهلاً بك! أنا مساعدك الذكي، كيف أساعدك اليوم؟" });
            case cleanText === "جمال" || cleanText.startsWith("نسبة جمال"):
                return sock.sendMessage(remoteJid, { text: `✨ نسبة الجمال: ${Math.floor(Math.random() * 101)}%` });
            case cleanText === "فخامة" || cleanText.startsWith("نسبة فخامة"):
                return sock.sendMessage(remoteJid, { text: `👑 نسبة الفخامة: ${Math.floor(Math.random() * 101)}%` });
            case cleanText === "ايقوني" || cleanText === "أيقوني":
                return sock.sendMessage(remoteJid, { text: `💎 نسبة الأيقنة: ${Math.floor(Math.random() * 150)}%` });
        }
    });
}

startBot();

