// Plugin: HACKER PLUGIN (19 Comandos)
// Compatível com Revenge / Bunny / Vendetta

const { plugin } = window.revenge || window.vendetta;
const { commands, metro, patcher, ui } = plugin;
const { findByProps, findByStoreName } = metro;
const { showToast } = ui.toasts;
const { showAlert } = ui.alerts;

// Módulos internos do cliente Discord
const MessageActions = findByProps("sendMessage", "receiveMessage");
const FluxDispatcher = findByProps("dispatch", "subscribe");
const MessageStore = findByStoreName("MessageStore");
const SelectedChannelStore = findByStoreName("SelectedChannelStore");
const UserStore = findByStoreName("UserStore");

// Estado em memória (inicia no momento em que o plugin é ativado)
const state = {
    startedAt: Date.now(),
    cachedMessages: new Map(), // Guarda mensagens vistas após ativação
    deletedLogs: [],
    editedLogs: [],
    ghostedUsers: new Set(),
    lastTarget: null,
    unpatches: []
};

// Utilitários auxiliares
function sendPublicMessage(channelId, content) {
    if (!channelId || !content) return;
    MessageActions.sendMessage(channelId, {
        content: content,
        tts: false,
        invalidEmojis: [],
        validNonShortcutEmojis: []
    });
}

function showLocalBox(title, body) {
    showAlert({
        title: title,
        content: body,
        confirmText: "FECHAR"
    });
}

function getOptionValue(args, name) {
    const opt = args?.find(a => a.name === name);
    return opt ? opt.value : null;
}

function formatTarget(userId) {
    if (!userId) return "Usuário Desconhecido";
    state.lastTarget = userId;
    return `<@${userId}>`;
}

// ==========================================
// MONITORAMENTO EM TEMPO REAL (CLIENT-SIDE)
// ==========================================
function startMonitoring() {
    // Intercepta novas mensagens recebidas para guardar o conteúdo original
    const unpatchReceive = patcher.before("receiveMessage", MessageActions, (args) => {
        const msg = args[1];
        if (msg && msg.id && msg.content) {
            state.cachedMessages.set(msg.id, {
                id: msg.id,
                channelId: msg.channel_id,
                author: msg.author?.username || "Desconhecido",
                authorId: msg.author?.id,
                content: msg.content,
                timestamp: new Date().toLocaleTimeString("pt-BR")
            });
        }
    });

    // Escuta eventos de edição e exclusão no FluxDispatcher
    const onMessageDelete = (event) => {
        if (!event || !event.id) return;
        const cached = state.cachedMessages.get(event.id);
        if (cached) {
            state.deletedLogs.push({
                ...cached,
                deletedAt: new Date().toLocaleTimeString("pt-BR")
            });
        }
    };

    const onMessageUpdate = (event) => {
        const msg = event?.message;
        if (!msg || !msg.id || !msg.content) return;
        const cached = state.cachedMessages.get(msg.id);
        if (cached && cached.content !== msg.content) {
            state.editedLogs.push({
                author: cached.author,
                authorId: cached.authorId,
                before: cached.content,
                after: msg.content,
                editedAt: new Date().toLocaleTimeString("pt-BR")
            });
            cached.content = msg.content;
            state.cachedMessages.set(msg.id, cached);
        }
    };

    FluxDispatcher.subscribe("MESSAGE_DELETE", onMessageDelete);
    FluxDispatcher.subscribe("MESSAGE_UPDATE", onMessageUpdate);

    // Filtro visual para o comando /fantasma (oculta mensagens do alvo só na sua tela)
    const unpatchGhost = patcher.before("receiveMessage", MessageActions, (args) => {
        const msg = args[1];
        if (msg && msg.author && state.ghostedUsers.has(msg.author.id)) {
            args[1] = null;
        }
    });

    state.unpatches.push(unpatchReceive, unpatchGhost, () => {
        FluxDispatcher.unsubscribe("MESSAGE_DELETE", onMessageDelete);
        FluxDispatcher.unsubscribe("MESSAGE_UPDATE", onMessageUpdate);
    });
}

// ==========================================
// REGISTRO DOS 19 COMANDOS (PREFIXO "/")
// ==========================================
function registerAllCommands() {
    const list = [
        // --- BLOCO 1: TROLLAGEM NO CHAT / DM (4 comandos) ---
        {
            name: "ban",
            displayName: "ban",
            description: "Envia alerta falso de banimento automático pelo sistema SHADOW.",
            options: [{ name: "usuario", displayName: "usuario", description: "Alvo", type: 6, required: true }],
            execute: (args, ctx) => {
                const target = formatTarget(getOptionValue(args, "usuario"));
                const msg = `\`\`\`ini\n[⚠️ SISTEMA SHADOW - ALERTA CRÍTICO]\n\`\`\`\n> **STATUS:** O usuário ${target} será **banido em 5 dias** automaticamente pelo sistema de hackeamento do Discord.\n> **CÓDIGO DE EXECUÇÃO:** \`#SHD-BAN-05D\``;
                sendPublicMessage(ctx.channel.id, msg);
            }
        },
        {
            name: "hackearconta",
            displayName: "hackearconta",
            description: "Envia aviso falso de invasão pelo sistema do Hacker SHADOW.",
            options: [{ name: "usuario", displayName: "usuario", description: "Alvo", type: 6, required: true }],
            execute: (args, ctx) => {
                const target = formatTarget(getOptionValue(args, "usuario"));
                const msg = `\`\`\`diff\n- [👾 SHADOW SYSTEM - ACESSO CONCEDIDO]\n\`\`\`\n> **NOTIFICAÇÃO:** O usuário ${target} foi hackeado pelo sistema do **Hacker SHADOW**. Sua conta está sob domínio do **grupo SHADOW**.`;
                sendPublicMessage(ctx.channel.id, msg);
            }
        },
        {
            name: "aviso",
            displayName: "aviso",
            description: "Envia um comunicado robótico estilizado no chat ou DM.",
            options: [{ name: "texto", displayName: "texto", description: "Mensagem do alerta", type: 3, required: true }],
            execute: (args, ctx) => {
                const texto = getOptionValue(args, "texto");
                const msg = `\`\`\`fix\n[🤖 TRANSMISSÃO AUTOMÁTICA DO SISTEMA]\n\`\`\`\n> **COMUNICADO:** ${texto}`;
                sendPublicMessage(ctx.channel.id, msg);
            }
        },
        {
            name: "quarentena",
            displayName: "quarentena",
            description: "Envia aviso falso de conta em observação temporária.",
            options: [{ name: "usuario", displayName: "usuario", description: "Alvo", type: 6, required: true }],
            execute: (args, ctx) => {
                const target = formatTarget(getOptionValue(args, "usuario"));
                const msg = `\`\`\`ini\n[🔒 SHADOW LOCK - QUARENTENA ATIVA]\n\`\`\`\n> **AVISO:** A conta de ${target} entrou em modo de observação temporária do sistema **SHADOW**.`;
                sendPublicMessage(ctx.channel.id, msg);
            }
        },

        // --- BLOCO 2: TROLLAGEM VISUAL (SÓ NA SUA TELA - 5 comandos) ---
        {
            name: "fakenitro",
            displayName: "fakenitro",
            description: "Simula visualmente na sua tela a ativação de um badge especial.",
            options: [],
            execute: () => {
                showLocalBox("✨ NITRO SHADOW ATIVADO (VISUAL)", "Modo visual especial ativado apenas na sua tela!\nStatus: Assinatura Fantasma [9999 dias].");
            }
        },
        {
            name: "chatbaguncado",
            displayName: "chatbaguncado",
            description: "Exibe na sua tela uma prévia invertida/embaralhada do chat.",
            options: [{ name: "texto", displayName: "texto", description: "Texto para embaralhar na tela", type: 3, required: true }],
            execute: (args) => {
                const txt = getOptionValue(args, "texto") || "";
                const baguncado = txt.split("").reverse().join("");
                showLocalBox("🌀 MODO CHAT BAGUNÇADO (LOCAL)", `Original: ${txt}\nInvertido na sua tela: ${baguncado}`);
            }
        },
        {
            name: "modoshadow",
            displayName: "modoshadow",
            description: "Ativa o painel visual temático SHADOW apenas para você.",
            options: [],
            execute: () => {
                showToast("👾 Modo Visual SHADOW ativado na sua interface!");
                showLocalBox("👾 HACKER PLUGIN - MODO SHADOW", "Terminal local sincronizado.\nVisibilidade: Apenas você.");
            }
        },
        {
            name: "fantasma",
            displayName: "fantasma",
            description: "Oculta visualmente novas mensagens de um usuário só na sua tela.",
            options: [{ name: "usuario", displayName: "usuario", description: "Usuário para ocultar", type: 6, required: true }],
            execute: (args) => {
                const userId = getOptionValue(args, "usuario");
                state.lastTarget = userId;
                if (state.ghostedUsers.has(userId)) {
                    state.ghostedUsers.delete(userId);
                    showToast("👻 Modo fantasma desativado para este usuário.");
                } else {
                    state.ghostedUsers.add(userId);
                    showToast("👻 Usuário ocultado visualmente só na sua tela!");
                }
            }
        },
        {
            name: "eco",
            displayName: "eco",
            description: "Repete uma mensagem visualmente em cascata só na sua tela.",
            options: [{ name: "texto", displayName: "texto", description: "Texto do eco", type: 3, required: true }],
            execute: (args) => {
                const txt = getOptionValue(args, "texto");
                showLocalBox("🔊 ECO VISUAL", `${txt}\n  ↳ ${txt}\n    ↳ ${txt.toLowerCase()}...`);
            }
        },

        // --- BLOCO 3: UTILIDADE E MONITORAMENTO (SÓ NA SUA TELA - 5 comandos) ---
        {
            name: "mensagensapagadas",
            displayName: "mensagensapagadas",
            description: "Mostra na sua tela as mensagens apagadas desde a ativação do plugin.",
            options: [],
            execute: () => {
                if (state.deletedLogs.length === 0) {
                    showLocalBox("🗑️ MENSAGENS APAGADAS", "Nenhuma mensagem apagada foi capturada desde que você ativou o HACKER PLUGIN.");
                    return;
                }
                const formatted = state.deletedLogs
                    .slice(-15)
                    .map((m, i) => `${i + 1}. [${m.deletedAt}] ${m.author}: ${m.content}`)
                    .join("\n\n");
                showLocalBox(`🗑️ MENSAGENS APAGADAS (${state.deletedLogs.length})`, formatted);
            }
        },
        {
            name: "mensagenseditadas",
            displayName: "mensagenseditadas",
            description: "Mostra o antes e depois das mensagens editadas após ativação.",
            options: [],
            execute: () => {
                if (state.editedLogs.length === 0) {
                    showLocalBox("✏️ MENSAGENS EDITADAS", "Nenhuma mensagem editada foi capturada desde a ativação.");
                    return;
                }
                const formatted = state.editedLogs
                    .slice(-10)
                    .map((m, i) => `${i + 1}. [${m.editedAt}] ${m.author}:\n   Antes: ${m.before}\n   Depois: ${m.after}`)
                    .join("\n\n");
                showLocalBox(`✏️ MENSAGENS EDITADAS (${state.editedLogs.length})`, formatted);
            }
        },
        {
            name: "ultimosapagados",
            displayName: "ultimosapagados",
            description: "Filtra os últimos N registros de mensagens apagadas na sua tela.",
            options: [{ name: "quantidade", displayName: "quantidade", description: "Número de mensagens", type: 4, required: true }],
            execute: (args) => {
                const qtd = Math.max(1, Math.min(25, getOptionValue(args, "quantidade") || 5));
                const slice = state.deletedLogs.slice(-qtd);
                if (slice.length === 0) {
                    showLocalBox("🗑️ ÚLTIMOS APAGADOS", "Nenhum registro apagado encontrado ainda.");
                    return;
                }
                const formatted = slice.map((m, i) => `${i + 1}. [${m.deletedAt}] ${m.author}: ${m.content}`).join("\n\n");
                showLocalBox(`🗑️ ÚLTIMAS ${slice.length} APAGADAS`, formatted);
            }
        },
        {
            name: "buscarmsg",
            displayName: "buscarmsg",
            description: "Busca uma palavra nas mensagens monitoradas/apagadas.",
            options: [{ name: "palavra", displayName: "palavra", description: "Termo de busca", type: 3, required: true }],
            execute: (args) => {
                const term = (getOptionValue(args, "palavra") || "").toLowerCase();
                const all = Array.from(state.cachedMessages.values());
                const matches = all.filter(m => m.content.toLowerCase().includes(term)).slice(-10);
                if (matches.length === 0) {
                    showLocalBox("🔍 BUSCAR MENSAGEM", `Nenhum resultado para "${term}".`);
                    return;
                }
                const formatted = matches.map(m => `[${m.timestamp}] ${m.author}: ${m.content}`).join("\n\n");
                showLocalBox(`🔍 RESULTADOS PARA "${term}"`, formatted);
            }
        },
        {
            name: "statusmonitor",
            displayName: "statusmonitor",
            description: "Mostra há quanto tempo o monitoramento está ativo e estatísticas.",
            options: [],
            execute: () => {
                const mins = Math.floor((Date.now() - state.startedAt) / 60000);
                showLocalBox(
                    "📊 STATUS - HACKER PLUGIN",
                    `• Tempo ativo: ${mins} minuto(s)\n• Mensagens em cache: ${state.cachedMessages.size}\n• Apagadas capturadas: ${state.deletedLogs.length}\n• Editadas capturadas: ${state.editedLogs.length}`
                );
            }
        },

        // --- BLOCO 4: CONTROLE E DIVERSÃO (5 comandos) ---
        {
            name: "limparvisual",
            displayName: "limparvisual",
            description: "Limpa filtros visuais locais sem apagar o histórico de monitoramento.",
            options: [],
            execute: () => {
                state.ghostedUsers.clear();
                showToast("🧹 Filtros visuais locais limpos!");
            }
        },
        {
            name: "veralvo",
            displayName: "veralvo",
            description: "Mostra na sua tela o último usuário selecionado nos comandos.",
            options: [],
            execute: () => {
                if (!state.lastTarget) {
                    showLocalBox("🎯 ALVO ATUAL", "Nenhum usuário foi selecionado ainda.");
                    return;
                }
                const user = UserStore.getUser(state.lastTarget);
                showLocalBox("🎯 ALVO ATUAL", `Usuário: ${user ? user.username : "ID"} (${state.lastTarget})`);
            }
        },
        {
            name: "contar",
            displayName: "contar",
            description: "Conta quantas mensagens de um usuário foram monitoradas.",
            options: [{ name: "usuario", displayName: "usuario", description: "Usuário", type: 6, required: true }],
            execute: (args) => {
                const userId = getOptionValue(args, "usuario");
                state.lastTarget = userId;
                const count = Array.from(state.cachedMessages.values()).filter(m => m.authorId === userId).length;
                showLocalBox("🔢 CONTADOR DE MENSAGENS", `Mensagens registradas deste usuário desde a ativação: ${count}`);
            }
        },
        {
            name: "moeda",
            displayName: "moeda",
            description: "Joga cara ou coroa instantaneamente na sua tela.",
            options: [],
            execute: () => {
                const res = Math.random() < 0.5 ? "🪙 CARA!" : "👑 COROA!";
                showToast(`Resultado: ${res}`);
            }
        },
        {
            name: "ajuda",
            displayName: "ajuda",
            description: "Lista todos os 19 comandos disponíveis no HACKER PLUGIN.",
            options: [],
            execute: () => {
                const menu = [
                    "1. /ban @usuario",
                    "2. /hackearconta @usuario",
                    "3. /aviso [texto]",
                    "4. /quarentena @usuario",
                    "5. /fakenitro",
                    "6. /chatbaguncado [texto]",
                    "7. /modoshadow",
                    "8. /fantasma @usuario",
                    "9. /eco [texto]",
                    "10. /mensagensapagadas",
                    "11. /mensagenseditadas",
                    "12. /ultimosapagados [qtd]",
                    "13. /buscarmsg [palavra]",
                    "14. /statusmonitor",
                    "15. /limparvisual",
                    "16. /veralvo",
                    "17. /contar @usuario",
                    "18. /moeda",
                    "19. /ajuda"
                ].join("\n");
                showLocalBox("📜 HACKER PLUGIN - 19 COMANDOS", menu);
            }
        }
    ];

    list.forEach(cmd => {
        const unregister = commands.registerCommand({
            name: cmd.name,
            displayName: cmd.displayName,
            description: cmd.description,
            displayDescription: cmd.description,
            options: cmd.options,
            applicationId: "-1",
            inputType: 1,
            type: 1,
            execute: cmd.execute
        });
        state.unpatches.push(unregister);
    });
}

// Ciclo de vida do plugin no Revenge
export default {
    onLoad: () => {
        state.startedAt = Date.now();
        startMonitoring();
        registerAllCommands();
        showToast("👾 HACKER PLUGIN (19 Comandos) ativado! Monitorando mensagens...");
    },
    onUnload: () => {
        state.unpatches.forEach(unpatch => {
            try { unpatch(); } catch (e) {}
        });
        state.cachedMessages.clear();
        state.deletedLogs = [];
        state.editedLogs = [];
        state.ghostedUsers.clear();
        showToast("HACKER PLUGIN desativado.");
    }
};
