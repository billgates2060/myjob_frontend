// Sistema de notificações para o MyJob
const notifications = {
    // Criar elemento de notificação
    createNotification: (message, type) => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;

        // Adicionar ao container de notificações
        let container = document.querySelector('.notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }
        container.appendChild(notification);

        // Adicionar evento de fechar
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Auto-remover após 5 segundos
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);

        return notification;
    },

    // Mostrar notificação de sucesso
    success: (message) => {
        return notifications.createNotification(message, 'success');
    },

    // Mostrar notificação de erro
    error: (message) => {
        return notifications.createNotification(message, 'error');
    },

    // Mostrar notificação de informação
    info: (message) => {
        return notifications.createNotification(message, 'info');
    },

    // Mostrar notificação de aviso
    warning: (message) => {
        return notifications.createNotification(message, 'warning');
    }
}; 