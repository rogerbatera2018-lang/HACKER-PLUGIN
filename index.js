// HACKER PLUGIN - Base Atualizada Revenge + Bunny (19 Comandos)

const state = {
    startedAt: Date.now(),
    cachedMessages: new Map(),
    deletedLogs: [],
    editedLogs: [],
    ghostedUsers: new Set(),
    lastTarget: null,
    cleanups: []
};

function getClientApi() {
    return window.Bunny || window.Revenge || globalThis.Bunny || globalThis.Revenge || null;
}

function getCommandsApi() {
    const client = getClientApi();
    return client?.commands || null;
}

function getMetroApi() {
    const client = getClientApi();
    return client?.metro || null;
}

function getPatcherApi() {
    const client = getClientApi();
    return client?.patcher || null;
}

function showToastSafe(msg) {
    try {
        const client = getClientApi();
        client?.ui?.toasts?.showToast?.(msg);
    } catch {}
    console.log("[HACKER PLUGIN] " + msg);
}

function showBoxSafe(title, body) {
    try {
        const client = getClientApi();
        const alert = client?.ui?.alerts?.showAlert;
        if (alert) {
            alert({ title, content: body, confirmText: "FECHAR" });
            return;
        }
    } catch {}
    showToastSafe(title + " - " + body);
}

function getOptionValue(args, name) {
    const opt = Array.isArray(args) ? args.find(a => a && a.name === name) : null;
    return opt ? opt.value : null;
}

function formatTarget(userId) {
    if (!userId) return "Usuário Desconhecido";
    state.lastTarget = userId;
    return `<@${userId}>`;
}

function getMessageActions() {
    const metro = getMetroApi();
    return metro?.findByProps?.("sendMessage", "receiveMessage") || null;
}

function getFluxDispatcher() {
    const metro = getMetroApi();
    return metro?.findByProps?.("dispatch", "subscribe") || null;
}

function getUserStore() {
    const metro = getMetroApi();
    return metro?.findByStoreName?.("UserStore") || null;
}

function sendPublicMessage(channelId, content) {
    if (!channelId || !content) return;
    const MessageActions = getMessageActions();
    if (typeof MessageActions?.sendMessage === "function") {
        MessageActions.sendMessage(channelId, {
            content,
            tts: false,
            invalidEmojis: [],
            validNonShortcutEmojis: []
        });
    }
}

function startMonitoring() {
    const MessageActions = getMessageActions();
    const FluxDispatcher = getFluxDispatcher();
    const patcher = getPatcherApi();

    if (typeof MessageActions?.receiveMessage === "function" && typeof patcher?.before === "function") {
        const unpatchReceive = patcher.before("receiveMessage", MessageActions, (args) => {
            const msg = args?.[1];
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
        if (typeof unpatchReceive === "function") state.cleanups.push(unpatchReceive);

        const unpatchGhost = patcher.before("receiveMessage", MessageActions, (args) => {
            const msg = args?.[1];
            if (msg && msg.author && state.ghostedUsers.has(msg.author.id)) {
                args[1] = null;
            }
        });
        if (typeof unpatchGhost === "function") state.cleanups.push(unpatchGhost);
    }

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

    if (typeof FluxDispatcher?.subscribe === "function") {
        FluxDispatcher.subscribe("MESSAGE_DELETE", onMessageDelete);
        FluxDispatcher.subscribe("MESSAGE_UPDATE", onMessageUpdate);
        state.cleanups.push(() => {
            try { FluxDispatcher.unsubscribe("MESSAGE_DELETE", onMessageDelete); } catch {}
            try { FluxDispatcher.unsubscribe("MESSAGE_UPDATE", onMessageUpdate); } catch {}
        });
    }
}

function registerAllCommands(commands) {
    const list = [
        // --- BLOCO 1: CHAT / DM (4 comandos) ---
        {
            name: "ban",
            displayName: "ban",
            description: "Envia alerta falso de banimento automático pelo sistema SHADOW.",
            options: [{ name: "usuario", displayName: "usuario", description: "Alvo", type: 6, required: true }],
            execute: (args, ctx) => {
                const target = formatTarget(getOptionValue(args, "usuario"));
                const msg = `\`\`\`ini\n[⚠️ SISTEMA SHADOW - ALERTA CRÍTICO]\n\`\`\`\n> **STATUS:** O usuário ${target} será **banido em 5 dias** automaticamente pelo sistema de hackeamento do Discord.\n> **CÓDIGO DE EXECUÇÃO:** \`#SHD-BAN-05D\``;
                sendPublicMessage(ctx?.channel?.id, msg);
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
                sendPublicMessage(ctx?.channel?.id, msg);
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
                sendPublicMessage(ctx?.channel?.id, msg);
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
                sendPublicMessage(ctx?.channel?.id, msg);
            }
        },

        // --- BLOCO 2: VISUAL LOCAL / SÓ NA SUA TELA (5 comandos) ---
        {
            name: "fakenitro",
            displayName: "fakenitro",
            description: "Simula visualmente na sua tela a ativação de um badge especial.",
            options: [],
            execute: () => {
                showBoxSafe("✨ NITRO SHADOW ATIVADO (VISUAL)", "Modo visual especial ativado apenas na sua tela!\nStatus: Assinatura Fantasma [9999 dias].");
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
                showBoxSafe("🌀 MODO CHAT BAGUNÇADO (LOCAL)", `Original: ${txt}\nInvertido na sua tela: ${baguncado}`);
            }
        },
        {
            name: "modoshadow",
            displayName: "modoshadow",
            description: "Ativa o painel visual temático SHADOW apenas para você.",
            options: [],
            execute: () => {
                showToastSafe("👾 Modo Visual SHADOW ativado na sua interface!");
                showBoxSafe("👾 HACKER PLUGIN - MODO SHADOW", "Terminal local sincronizado.\nVisibilidade: Apenas você.");
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
                    showToastSafe("👻 Modo fantasma desativado para este usuário.");
                } else {
                    state.ghostedUsers.add(userId);
                    showToastSafe("👻 Usuário ocultado visualmente só na sua tela!");
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
                showBoxSafe("🔊 ECO VISUAL", `${txt}\n  ↳ ${txt}\n    ↳ ${txt.toLowerCase()}...`);
            }
        },

        // --- BLOCO 3: MONITORAMENTO E UTILIDADE / SÓ NA SUA TELA (5 comandos) ---
        {
            name: "mensagensapagadas",
            displayName: "mensagensapagadas",
            description: "Mostra na sua tela as mensagens apagadas desde a ativação do plugin.",
            options: [],
            execute: () => {
                if (state.deletedLogs.length === 0) {
                    showBoxSafe("🗑️ MENSAGENS APAGADAS", "Nenhuma mensagem apagada foi capturada desde que você ativou o HACKER PLUGIN.");
                    return;
                }
                const formatted = state.deletedLogs
                    .slice(-15)
                    .map((m, i) => `${i + 1}. [${m.deletedAt}] ${m.author}: ${m.content}`)
                    .join("\n\n");
                showBoxSafe(`🗑️ MENSAGENS APAGADAS (${state.deletedLogs.length})`, formatted);
            }
        },
        {
            name: "mensagenseditadas",
            displayName: "mensagenseditadas",
            description: "Mostra o antes e depois das mensagens editadas após ativação.",
            options: [],
            execute: () => {
                if (state.editedLogs.length === 0) {
                    showBoxSafe("✏️ MENSAGENS EDITADAS", "Nenhuma mensagem editada foi capturada desde a ativação.");
                    return;
                }
                const formatted = state.editedLogs
                    .slice(-10)
                    .map((m, i) => `${i + 1}. [${m.editedAt}] ${m.author}:\n   Antes: ${m.before}\n   Depois: ${m.after}`)
                    .join("\n\n");
                showBoxSafe(`✏️ MENSAGENS EDITADAS (${state.editedLogs.length})`, formatted);
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
                    showBoxSafe("🗑️ ÚLTIMOS APAGADOS", "Nenhum registro apagado encontrado ainda.");
                    return;
                }
                const formatted = slice.map((m, i) => `${i + 1}. [${m.deletedAt}] ${m.author}: ${m.content}`).join("\n\n");
                showBoxSafe(`🗑️ ÚLTIMAS ${slice.length} APAGADAS`, formatted);
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
                    showBoxSafe("🔍 BUSCAR MENSAGEM", `Nenhum resultado para "${term}".`);
                    return;
                }
                const formatted = matches.map(m => `[${m.timestamp}] ${m.author}: ${m.content}`).join("\n\n");
                showBoxSafe(`🔍 RESULTADOS PARA "${term}"`, formatted);
            }
        },
        {
            name: "statusmonitor",
            displayName: "statusmonitor",
            description: "Mostra há quanto tempo o monitoramento está ativo e estatísticas.",
            options: [],
            execute: () => {
                const mins = Math.floor((Date.now() - state.startedAt) / 60000);
                showBoxSafe(
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
                showToastSafe("🧹 Filtros visuais locais limpos!");
            }
        },
        {
            name: "veralvo",
            displayName: "veralvo",
            description: "Mostra na sua tela o último usuário selecionado nos comandos.",
            options: [],
            execute: () => {
                if (!state.lastTarget) {
                    showBoxSafe("🎯 ALVO ATUAL", "Nenhum usuário foi selecionado ainda.");
                    return;
                }
                const UserStore = getUserStore();
                const user = UserStore?.getUser?.(state.lastTarget);
                showBoxSafe("🎯 ALVO ATUAL", `Usuário: ${user ? user.username : "ID"} (${state.lastTarget})`);
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
                showBoxSafe("🔢 CONTADOR DE MENSAGENS", `Mensagens registradas deste usuário desde a ativação: ${count}`);
            }
        },
        {
            name: "moeda",
            displayName: "moeda",
            description: "Joga cara ou coroa instantaneamente na sua tela.",
            options: [],
            execute: () => {
                const res = Math.random() < 0.5 ? "🪙 CARA!" : "👑 COROA!";
                showToastSafe("Resultado: " + res);
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
                showBoxSafe("📜 HACKER PLUGIN - 19 COMANDOS", menu);
            }
        }
    ];

    list.forEach(cmd => {
        try {
            const unregister = commands.registerCommand({
                name: cmd.name,
                displayName: cmd.displayName,
                description: cmd.description,
                displayDescription: cmd.description,
                options: cmd.options,
                inputType: 1,
                type: 1,
                execute: cmd.execute
            });
            if (typeof unregister === "function") {
                state.cleanups.push(unregister);
            }
        } catch {}
    });
}

export default {
    onStart() {
        state.startedAt = Date.now();
        const commands = getCommandsApi();
        if (!commands?.registerCommand) {
            showToastSafe("HACKER PLUGIN ligado! Mas comandos não encontrados nesta versão");
            return;
        }
        startMonitoring();
        registerAllCommands(commands);
        showToastSafe("👾 HACKER PLUGIN (19 Comandos) ativado! Digita /ajuda");
    },

    onStop() {
        state.cleanups.forEach(fn => {
            try { fn(); } catch {}
        });
        state.cleanups = [];
        state.cachedMessages.clear();
        state.deletedLogs = [];
        state.editedLogs = [];
        state.ghostedUsers.clear();
        showToastSafe("HACKER PLUGIN desativado.");
    }
};
