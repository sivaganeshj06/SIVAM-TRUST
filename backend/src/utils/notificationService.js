const supabase = require('../config/supabase');
const auditLogger = require('./logger');

const clients = new Map(); // userId -> Array of Response objects

const addSseClient = (userId, res) => {
  if (!clients.has(userId)) {
    clients.set(userId, []);
  }
  clients.get(userId).push(res);
};

const removeSseClient = (userId, res) => {
  const userClients = clients.get(userId);
  if (userClients) {
    clients.set(userId, userClients.filter(c => c !== res));
  }
};

const sendRealtimeNotification = (userId, notification) => {
  const userClients = clients.get(userId);
  if (userClients) {
    const message = `data: ${JSON.stringify(notification)}\n\n`;
    userClients.forEach(res => {
      res.write(message);
    });
  }
};

const createNotification = async (userId, type, title, message) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{ user_id: userId, type, title, message }])
      .select('*')
      .single();

    if (error) {
      auditLogger.error('NOTIFICATION_DB_ERROR', { error: error.message, userId });
      return null;
    }

    // Push realtime SSE event
    sendRealtimeNotification(userId, data);

    // Send email copy asynchronously to not block API response
    supabase
      .from('members')
      .select('email')
      .eq('id', userId)
      .single()
      .then(({ data: user, error: userErr }) => {
        if (!userErr && user && user.email) {
          const { sendGenericNotificationEmail } = require('./mailer');
          sendGenericNotificationEmail(user.email, { title, message });
        }
      })
      .catch(mailErr => {
        auditLogger.error('NOTIFICATION_MAIL_FAILED', { error: mailErr.message, userId });
      });

    return data;
  } catch (err) {
    auditLogger.error('NOTIFICATION_ERROR', { error: err.message, userId });
    return null;
  }
};

const createNotificationForRole = async (roleName, type, title, message) => {
  try {
    let rolesToQuery = [roleName];
    if (roleName === 'co-founder') {
      rolesToQuery = ['co-founder', 'co-founder-1', 'co-founder-2'];
    }

    const { data: members, error } = await supabase
      .from('members')
      .select('id')
      .in('role', rolesToQuery)
      .eq('status', 'active');

    if (!error && members) {
      for (const m of members) {
        await createNotification(m.id, type, title, message);
      }
    }
  } catch (err) {
    auditLogger.error('ROLE_NOTIFICATION_ERROR', { error: err.message, roleName });
  }
};

module.exports = {
  addSseClient,
  removeSseClient,
  createNotification,
  createNotificationForRole
};
