
import { Team, Match, TournamentMode, TournamentType, Standing } from '../types';

export const generateFixtures = (teams: Team[], mode: TournamentMode, type?: TournamentType): Match[] => {
  const n = (teams || []).length;
  if (n < 2) return [];

  if (mode === TournamentMode.KNOCKOUT) {
    // UCL mode knockout is two-legged
    return generateKnockoutBracket(teams, type === TournamentType.CHAMPIONS_LEAGUE);
  }

  if (mode === TournamentMode.GROUP_KNOCKOUT) {
    return generateGroupKnockout(teams);
  }

  if (mode === TournamentMode.LEAGUE) {
    // Standard league with home and away
    const baseFixtures = generateFixtures(teams, TournamentMode.SINGLE);
    const numRounds = teams.length % 2 === 0 ? teams.length - 1 : teams.length;
    const returnFixtures = baseFixtures.map(m => ({
      ...m,
      id: `${m.id}-return`,
      homeTeamId: m.awayTeamId,
      awayTeamId: m.homeTeamId,
      round: m.round + numRounds,
      stageName: 'Liqa Mərhələsi'
    }));
    baseFixtures.forEach(m => m.stageName = 'Liqa Mərhələsi');
    return [...baseFixtures, ...returnFixtures];
  }

  if (mode === TournamentMode.LEAGUE_KNOCKOUT) {
    return generateLeagueKnockout(teams);
  }

  // SINGLE or HOME_AWAY
  const tempTeams = [...(teams || [])];
  if (n % 2 !== 0) {
    tempTeams.push({ id: 'bye', name: 'BYE', logo: '' });
  }

  const numTeams = tempTeams.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;
  const fixtures: Match[] = [];

  for (let round = 0; round < numRounds; round++) {
    for (let matchIdx = 0; matchIdx < matchesPerRound; matchIdx++) {
      const home = tempTeams[matchIdx];
      const away = tempTeams[numTeams - 1 - matchIdx];

      if (home.id !== 'bye' && away.id !== 'bye') {
        fixtures.push({
          id: `match-${round}-${matchIdx}`,
          homeTeamId: home.id,
          awayTeamId: away.id,
          homeScore: null,
          awayScore: null,
          isFinished: false,
          round: round + 1
        });
      }
    }
    const last = tempTeams.pop()!;
    tempTeams.splice(1, 0, last);
  }

  if (mode === TournamentMode.HOME_AWAY) {
    const returnFixtures = fixtures.map(m => ({
      ...m,
      id: `${m.id}-return`,
      homeTeamId: m.awayTeamId,
      awayTeamId: m.homeTeamId,
      round: m.round + numRounds
    }));
    return [...fixtures, ...returnFixtures];
  }

  return fixtures;
};

export const getCountryAbbreviation = (country: string): string => {
  const mapping: Record<string, string> = {
    "Azərbaycan": "AZE",
    "İngiltərə": "ENG",
    "İspaniya": "ESP",
    "Almaniya": "GER",
    "İtaliya": "ITA",
    "Fransa": "FRA",
    "Türkiyə": "TUR",
    "Portuqaliya": "POR",
    "Niderland": "NED",
    "Rusiya": "RUS",
    "Braziliya": "BRA",
    "Argentina": "ARG",
    "ABŞ": "USA",
    "Səudiyyə Ərəbistanı": "SAU",
    "Belçika": "BEL",
    "Şotlandiya": "SCO",
    "Ukrayna": "UKR",
    "Yunanıstan": "GRE",
    "Avstriya": "AUT"
  };
  if (!country) return "";
  return mapping[country] || country.substring(0, 3).toUpperCase();
};

const getStageName = (numMatches: number): string => {
  if (numMatches === 1) return "Final";
  if (numMatches === 2) return "Yarımfinal";
  if (numMatches === 4) return "1/4 Final";
  if (numMatches === 8) return "1/8 Final";
  if (numMatches === 16) return "1/16 Final";
  return `Son ${numMatches * 2}`;
};

const generateKnockoutBracket = (teams: Team[], twoLegged: boolean = false): Match[] => {
  const fixtures: Match[] = [];
  const n = teams.length;
  let powerOf2 = 1;
  while (powerOf2 < n) powerOf2 *= 2;
  
  const byes = powerOf2 - n;
  
  // Distribute byes evenly
  const paddedTeams: Team[] = [];
  let byeCount = byes;
  let teamIndex = 0;
  
  for (let i = 0; i < powerOf2; i += 2) {
    if (teamIndex < teams.length) {
      paddedTeams.push(teams[teamIndex++]);
    } else {
      paddedTeams.push({ id: 'bye', name: 'BYE', logo: '' });
    }
    
    if (byeCount > 0) {
      paddedTeams.push({ id: 'bye', name: 'BYE', logo: '' });
      byeCount--;
    } else if (teamIndex < teams.length) {
      paddedTeams.push(teams[teamIndex++]);
    } else {
      paddedTeams.push({ id: 'bye', name: 'BYE', logo: '' });
    }
  }

  // Shuffle or seed teams? Let's just use them as is (they are usually shuffled before this)
  let currentRoundTeams = paddedTeams;
  let roundNum = 1;
  let matchIdCounter = 1;
  let previousRoundMatches: Match[] = [];
  let isFirstRound = true;

  if (currentRoundTeams.length < 2) return fixtures;

  while (isFirstRound || previousRoundMatches.length > 1) {
    const currentRoundMatches: Match[] = [];
    const numMatches = isFirstRound ? currentRoundTeams.length / 2 : previousRoundMatches.length / 2;
    const stageName = getStageName(numMatches);
    const isFinal = numMatches === 1;

    const leg1Matches: Match[] = [];
    const leg2Matches: Match[] = [];

    for (let i = 0; i < numMatches; i++) {
      let homeId = 'tbd';
      let awayId = 'tbd';
      let isFinished = false;
      let homeScore = null;
      let awayScore = null;

      if (isFirstRound) {
        // First round
        const home = currentRoundTeams[i * 2];
        const away = currentRoundTeams[i * 2 + 1];
        homeId = home.id;
        awayId = away.id;
        
        // Auto-advance if playing against BYE
        if (homeId === 'bye' || awayId === 'bye') {
          isFinished = true;
          homeScore = homeId === 'bye' ? 0 : 3;
          awayScore = awayId === 'bye' ? 0 : 3;
        }
      }

      const match: Match = {
        id: `ko-${roundNum}-${matchIdCounter++}`,
        homeTeamId: homeId,
        awayTeamId: awayId,
        homeScore,
        awayScore,
        isFinished,
        round: roundNum,
        isKnockout: true,
        stageName
      };

      if (twoLegged && !isFinal && homeId !== 'bye' && awayId !== 'bye') {
        // Create the second leg
        const secondLeg: Match = {
          id: `${match.id}-leg2`,
          homeTeamId: awayId,
          awayTeamId: homeId,
          homeScore: null,
          awayScore: null,
          isFinished: false,
          round: roundNum, // Keep same round or increment? Let's keep same for grouping
          isKnockout: true,
          isSecondLeg: true,
          firstLegMatchId: match.id,
          stageName: `${stageName} (2-ci Oyun)`
        };
        match.stageName = `${stageName} (1-ci Oyun)`;
        
        if (!isFirstRound) {
          previousRoundMatches[i * 2].nextMatchId = match.id;
          previousRoundMatches[i * 2].nextMatchSlot = 'home';
          previousRoundMatches[i * 2 + 1].nextMatchId = match.id;
          previousRoundMatches[i * 2 + 1].nextMatchSlot = 'away';
        }

        currentRoundMatches.push(secondLeg); // Use second leg for progression
        leg1Matches.push(match);
        leg2Matches.push(secondLeg);
      } else {
        if (!isFirstRound) {
          previousRoundMatches[i * 2].nextMatchId = match.id;
          previousRoundMatches[i * 2].nextMatchSlot = 'home';
          previousRoundMatches[i * 2 + 1].nextMatchId = match.id;
          previousRoundMatches[i * 2 + 1].nextMatchSlot = 'away';
        }

        currentRoundMatches.push(match);
        leg1Matches.push(match);
      }
    }

    fixtures.push(...leg1Matches, ...leg2Matches);

    previousRoundMatches = currentRoundMatches;
    isFirstRound = false;
    roundNum++;
  }

  return fixtures;
};

const generateLeagueKnockout = (teams: Team[]): Match[] => {
  const fixtures: Match[] = [];
  
  let leagueFixtures: Match[] = [];
  
  if (teams.length <= 10) {
    leagueFixtures = generateFixtures(teams, TournamentMode.SINGLE);
  } else {
    // Generate 8 random matches per team
    const matchCounts: Record<string, number> = {};
    teams.forEach(t => matchCounts[t.id] = 0);
    
    let matchIdCounter = 1;
    let roundNum = 1;
    
    for (let r = 0; r < 8; r++) {
      const availableTeams = [...teams].sort(() => Math.random() - 0.5);
      const paired = new Set<string>();
      
      for (let i = 0; i < availableTeams.length; i++) {
        const home = availableTeams[i];
        if (paired.has(home.id)) continue;
        
        for (let j = i + 1; j < availableTeams.length; j++) {
          const away = availableTeams[j];
          if (paired.has(away.id)) continue;
          
          const alreadyPlayed = leagueFixtures.some(m => 
            (m.homeTeamId === home.id && m.awayTeamId === away.id) ||
            (m.homeTeamId === away.id && m.awayTeamId === home.id)
          );
          
          if (!alreadyPlayed) {
            leagueFixtures.push({
              id: `league-${matchIdCounter++}`,
              homeTeamId: home.id,
              awayTeamId: away.id,
              homeScore: null,
              awayScore: null,
              isFinished: false,
              round: roundNum,
              stageName: 'Liqa Mərhələsi'
            });
            paired.add(home.id);
            paired.add(away.id);
            matchCounts[home.id]++;
            matchCounts[away.id]++;
            break;
          }
        }
      }
      roundNum++;
    }
  }
  
  let maxLeagueRounds = 0;
  leagueFixtures.forEach(m => {
    m.id = `league-${m.id}`;
    m.stageName = 'Liqa Mərhələsi';
    fixtures.push(m);
    if (m.round > maxLeagueRounds) maxLeagueRounds = m.round;
  });

  // 2. Knockout Phase: Top 8 go to Ro16, 9-24 play playoffs
  // If teams < 24, we adjust.
  const hasPlayoffs = teams.length >= 24;
  
  if (hasPlayoffs) {
    // 1/16 Play-offs (9-24)
    const playoffMatches: Match[] = [];
    for (let i = 0; i < 8; i++) {
      const homePos = 9 + i;
      const awayPos = 24 - i;
      const matchId = `po-${i+1}`;
      
      const m1: Match = {
        id: matchId,
        homeTeamId: `L_${homePos}`,
        awayTeamId: `L_${awayPos}`,
        homeScore: null,
        awayScore: null,
        isFinished: false,
        round: maxLeagueRounds + 1,
        isKnockout: true,
        stageName: 'Pley-off (1/16) (1-ci Oyun)'
      };
      const m2: Match = {
        id: `${matchId}-leg2`,
        homeTeamId: `L_${awayPos}`,
        awayTeamId: `L_${homePos}`,
        homeScore: null,
        awayScore: null,
        isFinished: false,
        round: maxLeagueRounds + 1,
        isKnockout: true,
        isSecondLeg: true,
        firstLegMatchId: matchId,
        stageName: 'Pley-off (1/16) (2-ci Oyun)'
      };
      playoffMatches.push(m1, m2);
    }
    fixtures.push(...playoffMatches);

    // Ro16 onwards
    // Pairings: 1st vs Winner of 16/17 (PO Match 8), 2nd vs Winner of 15/18 (PO Match 7), etc.
    const ro16Teams: Team[] = [];
    for (let i = 0; i < 8; i++) {
      ro16Teams.push({ id: `L_${i+1}`, name: `${i+1}-ci Yer`, logo: '' });
      ro16Teams.push({ id: `POW_${8-i}`, name: `Pley-off Qalibi ${8-i}`, logo: '' });
    }
    
    const knockoutFixtures = generateKnockoutBracket(ro16Teams, true);
    knockoutFixtures.forEach(m => {
      m.round += maxLeagueRounds + 1;
      // Link PO winners to Ro16
      const poWinnerMatch = m.homeTeamId.match(/^POW_(\d+)$/) || m.awayTeamId.match(/^POW_(\d+)$/);
      if (poWinnerMatch && m.stageName?.includes('1/8 Final') && !m.isSecondLeg) {
        const poIdx = parseInt(poWinnerMatch[1], 10);
        const poLeg2 = playoffMatches.find(pm => pm.id === `po-${poIdx}-leg2`);
        if (poLeg2) {
          poLeg2.nextMatchId = m.id;
          poLeg2.nextMatchSlot = m.homeTeamId.startsWith('POW_') ? 'home' : 'away';
        }
      }
      fixtures.push(m);
    });
  } else {
    // Fallback for smaller leagues
    const numAdvancing = teams.length >= 16 ? 16 : (teams.length >= 8 ? 8 : 4);
    const knockoutTeams: Team[] = [];
    for (let i = 1; i <= numAdvancing; i++) {
      knockoutTeams.push({ id: `L_${i}`, name: `${i}-ci Yer`, logo: '' });
    }
    const pairedKnockoutTeams: Team[] = [];
    for (let i = 0; i < numAdvancing / 2; i++) {
      pairedKnockoutTeams.push(knockoutTeams[i]);
      pairedKnockoutTeams.push(knockoutTeams[numAdvancing - 1 - i]);
    }
    const knockoutFixtures = generateKnockoutBracket(pairedKnockoutTeams, true);
    knockoutFixtures.forEach(m => {
      m.round += maxLeagueRounds;
      fixtures.push(m);
    });
  }

  return fixtures;
};

const generateGroupKnockout = (teams: Team[]): Match[] => {
  const fixtures: Match[] = [];
  
  // Ensure numGroups is a power of 2 (1, 2, 4, 8)
  let numGroups = 1;
  if (teams.length >= 32) numGroups = 8;
  else if (teams.length >= 16) numGroups = 4;
  else if (teams.length >= 8) numGroups = 2;
  
  const groups: Record<string, Team[]> = {};
  
  for (let i = 0; i < numGroups; i++) {
    groups[String.fromCharCode(65 + i)] = [];
  }

  // Assign teams to groups
  teams.forEach((team, index) => {
    const groupName = String.fromCharCode(65 + (index % numGroups));
    groups[groupName].push(team);
  });

  // Generate round-robin for each group
  let maxGroupRounds = 0;
  Object.entries(groups).forEach(([groupName, groupTeams]) => {
    const groupFixtures = generateFixtures(groupTeams, TournamentMode.SINGLE);
    groupFixtures.forEach(m => {
      m.id = `group-${groupName}-${m.id}`;
      m.stageName = `Qrup ${groupName}`;
      fixtures.push(m);
      if (m.round > maxGroupRounds) maxGroupRounds = m.round;
    });
  });

  // Generate knockout bracket for top 2 of each group
  const knockoutTeams: Team[] = [];
  const groupNames = Object.keys(groups);
  
  if (groupNames.length === 1) {
    // If only 1 group, top 4 go to semis, or top 2 to final
    if (teams.length >= 4) {
      knockoutTeams.push({ id: 'G_A_1', name: '1-ci Qrup A', logo: '' });
      knockoutTeams.push({ id: 'G_A_4', name: '4-cü Qrup A', logo: '' });
      knockoutTeams.push({ id: 'G_A_2', name: '2-ci Qrup A', logo: '' });
      knockoutTeams.push({ id: 'G_A_3', name: '3-cü Qrup A', logo: '' });
    } else {
      knockoutTeams.push({ id: 'G_A_1', name: '1-ci Qrup A', logo: '' });
      knockoutTeams.push({ id: 'G_A_2', name: '2-ci Qrup A', logo: '' });
    }
  } else {
    // Standard cross-pairing (A1 vs B2, B1 vs A2, etc.)
    // To prevent teams from the same group meeting before the final,
    // we split the winners and runners-up into two halves of the bracket.
    const half1: Team[] = [];
    const half2: Team[] = [];

    for (let i = 0; i < groupNames.length; i += 2) {
      const g1 = groupNames[i];
      const g2 = groupNames[i + 1] || groupNames[0]; // Wrap around if odd
      
      half1.push({ id: `G_${g1}_1`, name: `1-ci Qrup ${g1}`, logo: '' });
      half1.push({ id: `G_${g2}_2`, name: `2-ci Qrup ${g2}`, logo: '' });
      
      half2.push({ id: `G_${g2}_1`, name: `1-ci Qrup ${g2}`, logo: '' });
      half2.push({ id: `G_${g1}_2`, name: `2-ci Qrup ${g1}`, logo: '' });
    }
    
    knockoutTeams.push(...half1, ...half2);
  }

  // Group Knockout (World Cup style) usually uses single leg, 
  // but if it's Champions League style with groups, it uses two legs.
  // Let's check the user's request. They said "Ucl zamanı".
  // I'll keep Group Knockout as single leg for now, unless it's UCL.
  const knockoutFixtures = generateKnockoutBracket(knockoutTeams, false);
  
  // Adjust rounds for knockout fixtures to start after group stage
  knockoutFixtures.forEach(m => {
    m.round += maxGroupRounds;
    fixtures.push(m);
  });

  return fixtures;
};

export const updateTournamentState = (matches: Match[], teams: Team[]): Match[] => {
  let updatedMatches = [...matches];

  // 1. Check if group stage is finished and update knockout placeholders
  const groupMatches = updatedMatches.filter(m => !m.isKnockout);
  const knockoutMatches = updatedMatches.filter(m => m.isKnockout);

  if (groupMatches.length > 0 && groupMatches.every(m => m.isFinished)) {
    // Calculate standings for each group
    const groups: Record<string, Match[]> = {};
    groupMatches.forEach(m => {
      const match = m.id.match(/^group-([A-Z])-/);
      if (match) {
        const groupName = match[1];
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(m);
      }
    });

    const groupStandings: Record<string, Standing[]> = {};
    Object.entries(groups).forEach(([groupName, gMatches]) => {
      // Find teams in this group
      const groupTeamIds = new Set<string>();
      gMatches.forEach(m => {
        groupTeamIds.add(m.homeTeamId);
        groupTeamIds.add(m.awayTeamId);
      });
      const groupTeams = teams.filter(t => groupTeamIds.has(t.id));
      groupStandings[groupName] = calculateStandings(groupTeams, gMatches);
    });

    // Replace placeholders in knockout matches
    updatedMatches = updatedMatches.map(m => {
      if (!m.isKnockout) return m;
      let newHomeId = m.homeTeamId;
      let newAwayId = m.awayTeamId;

      const updateId = (id: string) => {
        // Handle Group placeholders
        const groupMatch = id.match(/^G_([A-Z])_(\d)$/);
        if (groupMatch) {
          const groupName = groupMatch[1];
          const position = parseInt(groupMatch[2], 10) - 1;
          if (groupStandings[groupName] && groupStandings[groupName][position]) {
            return groupStandings[groupName][position].teamId;
          }
        }
        
        // Handle League placeholders
        const leagueMatch = id.match(/^L_(\d+)$/);
        if (leagueMatch) {
          const position = parseInt(leagueMatch[1], 10) - 1;
          const leagueMatches = groupMatches.filter(m => m.id.startsWith('league-'));
          if (leagueMatches.length > 0) {
            const overallStandings = calculateStandings(teams, leagueMatches);
            if (overallStandings[position]) {
              return overallStandings[position].teamId;
            }
          }
        }

        // Handle Playoff Winner placeholders
        const poWinnerMatch = id.match(/^POW_(\d+)$/);
        if (poWinnerMatch) {
          const poIndex = parseInt(poWinnerMatch[1], 10);
          const poMatchId = `po-${poIndex}`;
          const poMatchLeg2 = updatedMatches.find(m => m.id === `${poMatchId}-leg2`);
          const poMatchLeg1 = updatedMatches.find(m => m.id === poMatchId);
          
          if (poMatchLeg2 && poMatchLeg2.isFinished && poMatchLeg1) {
             const aggHome = (poMatchLeg1.homeScore || 0) + (poMatchLeg2.awayScore || 0);
             const aggAway = (poMatchLeg1.awayScore || 0) + (poMatchLeg2.homeScore || 0);
             if (aggHome > aggAway) return poMatchLeg1.homeTeamId;
             if (aggAway > aggHome) return poMatchLeg1.awayTeamId;
             return poMatchLeg2.penaltyWinnerId || id;
          }
        }
        
        return id;
      };

      newHomeId = updateId(newHomeId);
      newAwayId = updateId(newAwayId);

      return { ...m, homeTeamId: newHomeId, awayTeamId: newAwayId };
    });
  }

  // 2. Update knockout advancement
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 10) {
    changed = false;
    iterations++;
    
    // First, ensure all knockout matches have correct isFinished status based on current scores/penalties
    updatedMatches = updatedMatches.map(m => {
      if (!m.isKnockout) return m;
      
      let needsPenalty = false;
      if (m.homeScore !== null && m.awayScore !== null) {
        if (m.isSecondLeg && m.firstLegMatchId) {
          const firstLeg = updatedMatches.find(fm => fm.id === m.firstLegMatchId);
          if (firstLeg && firstLeg.homeScore !== null && firstLeg.awayScore !== null) {
            const aggHome = (firstLeg.homeScore || 0) + (m.awayScore || 0);
            const aggAway = (firstLeg.awayScore || 0) + (m.homeScore || 0);
            if (aggHome === aggAway) needsPenalty = true;
          }
        } else if (!updatedMatches.some(fm => fm.firstLegMatchId === m.id)) {
          // Single leg
          if (m.homeScore === m.awayScore) needsPenalty = true;
        }
      }

      const hasScores = m.homeScore !== null && m.awayScore !== null;
      const hasPenaltyWinner = !needsPenalty || (m.penaltyWinnerId !== undefined && m.penaltyWinnerId !== null);
      const isNowFinished = hasScores && hasPenaltyWinner;

      if (m.isFinished !== isNowFinished) {
        changed = true;
        return { ...m, isFinished: isNowFinished };
      }
      return m;
    });

    const currentMatches = [...updatedMatches];
    currentMatches.forEach(m => {
      // Only the "deciding" match (second leg or single leg) should trigger advancement
      const isDecidingMatch = m.isKnockout && m.isFinished && m.nextMatchId && 
                             (m.isSecondLeg || !currentMatches.some(fm => fm.firstLegMatchId === m.id));

      if (isDecidingMatch) {
        let winnerId: string | null = null;

        if (m.isSecondLeg && m.firstLegMatchId) {
          const firstLeg = currentMatches.find(fm => fm.id === m.firstLegMatchId);
          if (firstLeg && firstLeg.homeScore !== null && firstLeg.awayScore !== null) {
            const aggregateHome = (firstLeg.homeScore || 0) + (m.awayScore || 0);
            const aggregateAway = (firstLeg.awayScore || 0) + (m.homeScore || 0);
            
            if (aggregateHome > aggregateAway) {
              winnerId = firstLeg.homeTeamId;
            } else if (aggregateAway > aggregateHome) {
              winnerId = firstLeg.awayTeamId;
            } else {
              winnerId = m.penaltyWinnerId || null;
            }
          }
        } else {
          if ((m.homeScore || 0) > (m.awayScore || 0)) {
            winnerId = m.homeTeamId;
          } else if ((m.awayScore || 0) > (m.homeScore || 0)) {
            winnerId = m.awayTeamId;
          } else {
            winnerId = m.penaltyWinnerId || null;
          }
        }
        
        if (winnerId) {
          updatedMatches = updatedMatches.map(nextMatch => {
            if (nextMatch.id === m.nextMatchId) {
              let newHome = nextMatch.homeTeamId;
              let newAway = nextMatch.awayTeamId;
              
              if (m.nextMatchSlot === 'home') {
                if (newHome !== winnerId) {
                  newHome = winnerId!;
                  changed = true;
                }
              } else if (m.nextMatchSlot === 'away') {
                if (newAway !== winnerId) {
                  newAway = winnerId!;
                  changed = true;
                }
              }
              return { ...nextMatch, homeTeamId: newHome, awayTeamId: newAway };
            } else if (nextMatch.firstLegMatchId === m.nextMatchId) {
              // This is the second leg of the next round
              let newHome = nextMatch.homeTeamId;
              let newAway = nextMatch.awayTeamId;
              
              // In the second leg, slots are swapped
              if (m.nextMatchSlot === 'home') {
                if (newAway !== winnerId) {
                  newAway = winnerId!;
                  changed = true;
                }
              } else if (m.nextMatchSlot === 'away') {
                if (newHome !== winnerId) {
                  newHome = winnerId!;
                  changed = true;
                }
              }
              return { ...nextMatch, homeTeamId: newHome, awayTeamId: newAway };
            }
            return nextMatch;
          });
        }
      }
    });
  }

  return updatedMatches;
};

export const calculateStandings = (teams: Team[], matches: Match[]): Standing[] => {
  const stats: Record<string, Standing> = {};

  (teams || []).forEach(t => {
    stats[t.id] = {
      teamId: t.id, teamName: t.name, teamLogo: t.logo,
      played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, pts: 0, form: []
    };
  });

  // Oyunları raund sırasına görə sıralayırıq ki, form (Q-H-M) düzgün görünsün
  const sortedMatches = [...(matches || [])].sort((a, b) => (a.round || 0) - (b.round || 0));

  sortedMatches.forEach(m => {
    // Əgər hər iki tərəfə rəqəm daxil edilibsə (0 daxil olmaqla) cədvələ hesablanır
    if (m.homeScore === null || m.awayScore === null) return;

    const home = stats[m.homeTeamId];
    const away = stats[m.awayTeamId];
    if (!home || !away) return;

    home.played++;
    away.played++;
    home.gf += m.homeScore; home.ga += m.awayScore;
    away.gf += m.awayScore; away.ga += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.won++; home.pts += 3; away.lost++;
      home.form.push('Q'); away.form.push('M');
    } else if (m.homeScore < m.awayScore) {
      away.won++; away.pts += 3; home.lost++;
      home.form.push('M'); away.form.push('Q');
    } else {
      home.drawn++; away.drawn++;
      home.pts += 1; away.pts += 1;
      home.form.push('H'); away.form.push('H');
    }
    home.gd = home.gf - home.ga;
    away.gd = away.gf - away.ga;
  });

  Object.values(stats).forEach(s => { s.form = s.form.slice(-5); });

  return Object.values(stats).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
};

export const calculateGroupedStandings = (teams: Team[], matches: Match[]): Record<string, Standing[]> => {
  const groups: Record<string, Team[]> = {};
  const groupMatches: Record<string, Match[]> = {};

  // Find all groups and their matches
  matches.forEach(m => {
    if (m.stageName && (m.stageName.startsWith('Qrup ') || m.stageName === 'Liqa Mərhələsi')) {
      const groupName = m.stageName;
      if (!groupMatches[groupName]) groupMatches[groupName] = [];
      groupMatches[groupName].push(m);
      
      if (!groups[groupName]) groups[groupName] = [];
      const homeTeam = teams.find(t => t.id === m.homeTeamId);
      const awayTeam = teams.find(t => t.id === m.awayTeamId);
      
      if (homeTeam && !groups[groupName].find(t => t.id === homeTeam.id)) groups[groupName].push(homeTeam);
      if (awayTeam && !groups[groupName].find(t => t.id === awayTeam.id)) groups[groupName].push(awayTeam);
    }
  });

  const groupedStandings: Record<string, Standing[]> = {};
  Object.keys(groups).forEach(groupName => {
    groupedStandings[groupName] = calculateStandings(groups[groupName], groupMatches[groupName]);
  });

  return groupedStandings;
};
