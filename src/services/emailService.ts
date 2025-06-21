
// Service d'email simulé pour la démo
// Dans une application réelle, ceci serait connecté à un backend

export type EmailTemplate = {
  to: string;
  subject: string;
  body: string;
};

export const emailTemplates = {
  newUser: (email: string, username: string): EmailTemplate => ({
    to: email,
    subject: "Bienvenue sur StockPro - Vos informations de connexion",
    body: `
      <h2>Bienvenue sur StockPro!</h2>
      <p>Votre compte a été créé avec succès.</p>
      <p><strong>Nom d'utilisateur:</strong> ${username}</p>
      <p><strong>Pour votre première connexion:</strong> Utilisez le nom d'utilisateur ci-dessus. Un mot de passe temporaire vous sera fourni par un administrateur système.</p>
      <p>Nous vous recommandons de changer votre mot de passe après votre première connexion.</p>
    `
  }),
  
  resetPassword: (email: string): EmailTemplate => ({
    to: email,
    subject: "Réinitialisation de votre mot de passe StockPro",
    body: `
      <h2>Réinitialisation de mot de passe</h2>
      <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
      <p>Un nouveau mot de passe temporaire vous sera fourni par un administrateur système.</p>
      <p>Nous vous recommandons de changer votre mot de passe après votre prochaine connexion.</p>
    `
  })
};

export const sendEmail = async (emailTemplate: EmailTemplate): Promise<boolean> => {
  // Simuler un envoi d'email
  console.log("Email envoyé:", emailTemplate);
  
  // Dans une application Electron, vous pourriez utiliser:
  // - nodemailer pour l'envoi d'emails réels
  // - ou stocker les emails dans un fichier local pour les envoyer ultérieurement
  
  // Simulation du délai d'envoi
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return true;
};
