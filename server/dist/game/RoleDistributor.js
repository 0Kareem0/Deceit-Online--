"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleDistributor = void 0;
const shared_1 = require("@deceit/shared");
const roleData_1 = require("./roleData");
class RoleDistributor {
    static distributeRoles(players, settings) {
        const count = players.length;
        if (count < 5) {
            throw new Error('Minimum 5 players required for game distribution');
        }
        const availableRoles = [...roleData_1.ALL_ROLES];
        const pool = [];
        // 1. Mandatory Roles
        const kingRole = availableRoles.find((r) => r.id === 'king');
        const assassinRole = availableRoles.find((r) => r.id === 'assassin');
        const shadowLeaderRole = availableRoles.find((r) => r.id === 'shadow_leader');
        pool.push(kingRole);
        pool.push(shadowLeaderRole);
        pool.push(assassinRole);
        // Filter enabled role IDs from settings
        const enabledIds = settings.enabledRoleIds.length > 0
            ? settings.enabledRoleIds
            : roleData_1.ALL_ROLES.map((r) => r.id);
        const kingdomCandidates = availableRoles.filter((r) => r.faction === shared_1.Faction.kingdom && r.id !== 'king' && enabledIds.includes(r.id));
        const shadowCandidates = availableRoles.filter((r) => r.faction === shared_1.Faction.shadow && r.id !== 'shadow_leader' && r.id !== 'assassin' && enabledIds.includes(r.id));
        const neutralCandidates = settings.includeNeutrals
            ? availableRoles.filter((r) => r.faction === shared_1.Faction.neutral && enabledIds.includes(r.id))
            : [];
        // Calculate Faction Counts
        // Standard ratio: 1/3 Shadows, 1 Neutral (if 7+ players), rest Kingdom
        let shadowCount = Math.floor(count / 3);
        if (shadowCount < 2)
            shadowCount = 2; // At least 2 shadows (Leader + Assassin)
        let neutralCount = settings.includeNeutrals && count >= 6 ? 1 : 0;
        let kingdomCount = count - shadowCount - neutralCount;
        // Fill Shadow Roles (already have 2)
        const extraShadowsNeeded = shadowCount - 2;
        const shuffledShadows = [...shadowCandidates].sort(() => Math.random() - 0.5);
        for (let i = 0; i < extraShadowsNeeded && i < shuffledShadows.length; i++) {
            pool.push(shuffledShadows[i]);
        }
        // Fill Neutral Roles
        if (neutralCount > 0 && neutralCandidates.length > 0) {
            const shuffledNeutrals = [...neutralCandidates].sort(() => Math.random() - 0.5);
            pool.push(shuffledNeutrals[0]);
        }
        // Fill Kingdom Roles (already have 1 - King)
        const extraKingdomNeeded = count - pool.length;
        const shuffledKingdom = [...kingdomCandidates].sort(() => Math.random() - 0.5);
        for (let i = 0; i < extraKingdomNeeded; i++) {
            if (i < shuffledKingdom.length) {
                pool.push(shuffledKingdom[i]);
            }
            else {
                // Fallback to Citizen if out of special roles
                const citizenRole = roleData_1.ALL_ROLES.find((r) => r.id === 'citizen') || kingRole;
                pool.push(citizenRole);
            }
        }
        // Shuffle pool & assign to players
        const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
        const updatedPlayers = players.map((p, idx) => ({
            ...p,
            role: shuffledPool[idx],
        }));
        // Generate Turn Order with Shadow Leader -> Assassin seating constraint
        const turnOrder = this.generateTurnOrder(updatedPlayers);
        return { players: updatedPlayers, turnOrder };
    }
    static generateTurnOrder(players) {
        const total = players.length;
        const slPlayer = players.find((p) => p.role?.id === 'shadow_leader');
        const assassinPlayer = players.find((p) => p.role?.id === 'assassin');
        if (!slPlayer || !assassinPlayer) {
            return players.map((p) => p.id).sort(() => Math.random() - 0.5);
        }
        let order = players.map((p) => p.id).sort(() => Math.random() - 0.5);
        const slIdx = order.indexOf(slPlayer.id);
        let maxOffset = 2;
        if (total > 12)
            maxOffset = 4;
        else if (total > 7)
            maxOffset = 3;
        const offset = Math.floor(Math.random() * maxOffset) + 1;
        if (slIdx + offset >= total) {
            const newSlIdx = Math.floor(Math.random() * (total - maxOffset));
            order.splice(slIdx, 1);
            order.splice(newSlIdx, 0, slPlayer.id);
        }
        const finalSlIdx = order.indexOf(slPlayer.id);
        const desiredPos = finalSlIdx + offset;
        const currentAssIdx = order.indexOf(assassinPlayer.id);
        if (currentAssIdx !== desiredPos) {
            order.splice(currentAssIdx, 1);
            const insertAt = currentAssIdx < desiredPos ? desiredPos - 1 : desiredPos;
            order.splice(insertAt, 0, assassinPlayer.id);
        }
        return order;
    }
}
exports.RoleDistributor = RoleDistributor;
