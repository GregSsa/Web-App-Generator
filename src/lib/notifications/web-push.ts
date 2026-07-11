import webpush from "web-push";
let configured = false;
export function getWebPush() { if (!configured) { const subject = process.env.VAPID_SUBJECT; const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; const privateKey = process.env.VAPID_PRIVATE_KEY; if (!subject || !publicKey || !privateKey) throw new Error("VAPID non configuré"); webpush.setVapidDetails(subject, publicKey, privateKey); configured = true; } return webpush; }
