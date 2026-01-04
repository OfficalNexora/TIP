// We use regex for now as it is faster and deterministic for this specific request.

/**
 * Heuristics Engine for UNESCO Integrity Protocol
 * Performs deterministic forensic analysis on bilingual academic text.
 */
/**
 * HeuristicsService
 * Deterministic Forensic Analysis Engine (Rule-based, No LLM)
 * 
 * Features:
 * 1. Weighted Pattern Matching (extensible)
 * 2. Contextual Omission Detection (Trigger -> Expectation)
 * 3. Typography & Structure Analysis
 * 4. Granular Scoring System
 */

const PATTERN_DICTIONARY = [
    // 1. Introduction / Background
    { pattern: "in recent years, there has been a growing interest in", weight: 1.5, category: "intro" },
    { pattern: "with the rapid advancement of technology", weight: 2.0, category: "intro" },
    { pattern: "in today’s society", weight: 2.0, category: "intro" },
    { pattern: "importance of .*? cannot be overstated", weight: 1.5, category: "intro" },
    { pattern: "study aims to explore", weight: 0.5, category: "intro" },
    { pattern: "purpose of this research is to examine", weight: 0.5, category: "intro" },
    { pattern: "it is widely acknowledged that", weight: 1.2, category: "intro" },
    { pattern: "over the past decade", weight: 0.8, category: "intro" },
    { pattern: "despite previous research, gaps remain in", weight: 1.2, category: "gap" },
    { pattern: "there is a need for further investigation into", weight: 1.0, category: "gap" },
    { pattern: "recent developments in .*? highlight the importance of", weight: 1.5, category: "intro" },

    // 2. Literature Review
    { pattern: "according to .*? et al.", weight: 0.2, category: "lit_review" }, // very common human too
    { pattern: "researchers have argued that", weight: 0.8, category: "lit_review" },
    { pattern: "it has been demonstrated that", weight: 1.0, category: "lit_review" },
    { pattern: "several studies have confirmed that", weight: 1.2, category: "lit_review" },
    { pattern: "as reported in the literature", weight: 1.5, category: "lit_review" },
    { pattern: "existing research indicates that", weight: 1.0, category: "lit_review" },
    { pattern: "prior work has shown that", weight: 1.0, category: "lit_review" },
    { pattern: "studies suggest a correlation between", weight: 0.8, category: "lit_review" },
    { pattern: "aligns with previous findings", weight: 1.2, category: "lit_review" },

    // 3. Problem Statement / Gap
    { pattern: "however, there is limited research on", weight: 1.5, category: "gap" },
    { pattern: "few studies have addressed", weight: 1.5, category: "gap" },
    { pattern: "remains unclear", weight: 0.8, category: "gap" },
    { pattern: "lack of consensus on", weight: 1.2, category: "gap" },
    { pattern: "fails to consider", weight: 1.0, category: "gap" },
    { pattern: "gap exists in understanding", weight: 1.5, category: "gap" },
    { pattern: "seeks to fill the gap by", weight: 1.8, category: "gap" },
    { pattern: "pressing need to", weight: 1.2, category: "gap" },

    // 5. Methodology
    { pattern: "quantitative.*approach was employed", weight: 1.2, category: "method" },
    { pattern: "qualitative.*approach was employed", weight: 1.2, category: "method" },
    { pattern: "mixed-method approach was employed", weight: 1.5, category: "method" },
    { pattern: "sample consisted of", weight: 0.5, category: "method" },
    { pattern: "follow.*design", weight: 0.3, category: "method" },
    { pattern: "data analysis was conducted using", weight: 0.8, category: "method" },
    { pattern: "ethical considerations were observed in accordance with", weight: 1.5, category: "method" },
    { pattern: "participants provided informed consent prior to the study", weight: 1.2, category: "method" },
    { pattern: "validity and reliability were ensured by", weight: 1.5, category: "method" },
    { pattern: "data triangulation was conducted", weight: 1.5, category: "method" },

    // E. Methodology / Pamamaraan
    { pattern: "gumamit ang pananaliksik ng kwalitatibo/kwantitatibo/halo-halong pamamaraan", weight: 1.5, category: "method_ph" },
    { pattern: "nakolekta ang datos gamit ang", weight: 1.2, category: "method_ph" },
    { pattern: "binubuo ang sampol ng kalahok na pinili sa pamamagitan ng", weight: 1.5, category: "method_ph" },
    { pattern: "gumamit ng estrukturadong talatanungan/interbyu para sa pagkolekta ng datos", weight: 1.5, category: "method_ph" },
    { pattern: "sinuri ang datos gamit ang software na", weight: 1.5, category: "method_ph" },
    { pattern: "sinunod ang mga pamantayan sa etika sa pananaliksik", weight: 1.5, category: "method_ph" },
    { pattern: "tiniyak ang bisa at katiyakan ng pananaliksik sa pamamagitan ng", weight: 1.5, category: "method_ph" },
    { pattern: "ang disenyo ng pananaliksik ay sumusunod sa pamantayan ng", weight: 1.2, category: "method_ph" },
    { pattern: "ginamit ang triangulasyon ng datos upang mapahusay ang kredibilidad", weight: 1.8, category: "method_ph" },
    { pattern: "ang pag-aaral ay isinagawa sa loob ng tinukoy na panahon ng", weight: 1.2, category: "method_ph" },
    { pattern: "pinili ang kalahok batay sa pamantayan na", weight: 1.2, category: "method_ph" },
    { pattern: "ang instrumento ay sinuri para sa bisa at pagiging maaasahan", weight: 1.5, category: "method_ph" },
    { pattern: "ang mga hakbang sa pagkolekta ng datos ay dokumentado nang maayos", weight: 1.5, category: "method_ph" },
    { pattern: "ang proseso ng pagsusuri ng datos ay isinaayos ayon sa pamantayan ng", weight: 1.5, category: "method_ph" },
    { pattern: "siniguro ang kumpidensyalidad ng mga kalahok sa lahat ng yugto", weight: 1.5, category: "method_ph" },

    // F. Results / Resulta
    { pattern: "ipinapakita ng resulta na", weight: 1.0, category: "results_ph" },
    { pattern: "napag-alaman na", weight: 1.2, category: "results_ph" },
    { pattern: "ipinapahiwatig ng datos na", weight: 1.5, category: "results_ph" },
    { pattern: "may makabuluhang ugnayan sa pagitan ng", weight: 1.5, category: "results_ph" },
    { pattern: "ang trend ay nagpapakita ng", weight: 1.5, category: "results_ph" },
    { pattern: "ang analisis ay nagpakita na", weight: 1.5, category: "results_ph" },
    { pattern: "naitala ang pagbabago sa", weight: 1.2, category: "results_ph" },
    { pattern: "ang porsyento ng ay nagpapahiwatig na", weight: 1.5, category: "results_ph" },
    { pattern: "ang datos ay nagpapakita ng malinaw na pattern sa", weight: 1.8, category: "results_ph" },
    { pattern: "ang resulta ay sumusuporta sa hypothesis na", weight: 1.5, category: "results_ph" },
    { pattern: "ang mga natuklasan ay nagpapakita ng statistical significance", weight: 2.0, category: "results_ph" },
    { pattern: "may obserbableng pagtaas/pagbaba sa", weight: 1.2, category: "results_ph" },
    { pattern: "ang correlation analysis ay nagpakita ng", weight: 1.5, category: "results_ph" },
    { pattern: "ang descriptive statistics ay nagpapakita ng", weight: 1.5, category: "results_ph" },
    { pattern: "ang mga datos ay nagpapahiwatig ng posibleng ugnayan sa pagitan ng", weight: 1.5, category: "results_ph" },

    // G. Discussion / Talakayan
    { pattern: "ipinapahiwatig ng mga resulta na", weight: 1.2, category: "discussion_ph" },
    { pattern: "maaaring ipaliwanag ito sa pamamagitan ng", weight: 1.5, category: "discussion_ph" },
    { pattern: "ang pag-aaral na ito ay nagpapakita ng kahalagahan ng", weight: 1.5, category: "discussion_ph" },
    { pattern: "maaaring sabihing", weight: 1.2, category: "discussion_ph" },
    { pattern: "nagpapakita ang mga resulta ng pangangailangan para sa karagdagang pananaliksik", weight: 1.8, category: "discussion_ph" },
    { pattern: "ayon sa datos,", weight: 1.0, category: "discussion_ph" },
    { pattern: "ang findings ay sumusuporta sa mga naunang pag-aaral", weight: 1.5, category: "discussion_ph" },
    { pattern: "ang resulta ay nagpapakita ng pattern na nagpapahiwatig ng", weight: 1.8, category: "discussion_ph" },
    { pattern: "mahalagang suriin ang mga implikasyon ng resulta sa", weight: 1.5, category: "discussion_ph" },
    { pattern: "ang datos ay naglalahad ng posibleng paliwanag para sa", weight: 1.5, category: "discussion_ph" },
    { pattern: "ang talakayan ay nakatuon sa ugnayan ng mga variables na", weight: 1.5, category: "discussion_ph" },
    { pattern: "ang pag-aaral ay nagmumungkahi ng bagong pananaw sa", weight: 1.8, category: "discussion_ph" },
    { pattern: "ang obserbasyon ay nagpapahiwatig ng posibleng mekanismo sa likod ng", weight: 1.8, category: "discussion_ph" },
    { pattern: "ang analysis ay nagbibigay ng insight sa", weight: 1.5, category: "discussion_ph" },
    { pattern: "ang konteksto ng resulta ay nagpapahiwatig ng kahalagahan ng", weight: 1.5, category: "discussion_ph" },

    // H. Conclusion / Konklusyon
    { pattern: "bilang konklusyon,", weight: 0.5, category: "conclusion_ph" },
    { pattern: "ipinapakita ng pananaliksik na ito na", weight: 1.2, category: "conclusion_ph" },
    { pattern: "nag-aambag ang pag-aaral na ito sa pag-unawa sa", weight: 1.8, category: "conclusion_ph" },
    { pattern: "ang mga natuklasan ay may praktikal/teoretikal na kahalagahan", weight: 1.5, category: "conclusion_ph" },
    { pattern: "dapat isaalang-alang sa susunod na pananaliksik ang", weight: 1.5, category: "conclusion_ph" },
    { pattern: "nagbibigay ang pag-aaral ng batayan para sa karagdagang pagsusuri", weight: 1.5, category: "conclusion_ph" },
    { pattern: "ang resulta ay nagpapahiwatig ng posibleng aplikasyon sa", weight: 1.5, category: "conclusion_ph" },
    { pattern: "ang findings ay nagbibigay ng mahalagang insight sa", weight: 1.5, category: "conclusion_ph" },
    { pattern: "ang pananaliksik na ito ay nagpapakita ng halaga sa larangan ng", weight: 1.5, category: "conclusion_ph" },
    { pattern: "sa kabuuan, ang pag-aaral ay nagtatampok ng mga pangunahing natuklasan sa", weight: 1.5, category: "conclusion_ph" },
    { pattern: "ang pag-aaral ay nagbukas ng bagong perspektibo sa", weight: 1.8, category: "conclusion_ph" },
    { pattern: "ang implikasyon ng pananaliksik ay maaaring gamitin sa", weight: 1.5, category: "conclusion_ph" },
    { pattern: "ang mga resulta ay naglalahad ng posibilidad ng pagbuo ng mga bagong polisiya sa", weight: 1.8, category: "conclusion_ph" },
    { pattern: "nagbibigay ang pananaliksik ng suporta para sa teorya ng", weight: 1.5, category: "conclusion_ph" },
    { pattern: "ang pag-aaral ay naglalaman ng rekomendasyon para sa susunod na pananaliksik", weight: 1.5, category: "conclusion_ph" },
    { pattern: "serves as a basis for further exploration", weight: 1.8, category: "conclusion" },

    // 9. Limitations
    { pattern: "study is limited by", weight: 0.8, category: "limitations" },
    { pattern: "generalizability is limited due to", weight: 1.5, category: "limitations" },
    { pattern: "interpreted with caution", weight: 1.2, category: "limitations" },
    { pattern: "constraints of time and resources", weight: 1.5, category: "limitations" },

    // 10. Hedging
    { pattern: "it is important to note that", weight: 1.0, category: "hedging" },
    { pattern: "further investigation is warranted", weight: 1.5, category: "hedging" },
    { pattern: "while these findings are preliminary", weight: 1.2, category: "hedging" },

    // 11. Transitional
    { pattern: "moreover", weight: 0.2, category: "connector" },
    { pattern: "furthermore", weight: 0.2, category: "connector" },
    { pattern: "additionally", weight: 0.2, category: "connector" },
    { pattern: "on the other hand", weight: 0.2, category: "connector" },
    { pattern: "consequently", weight: 0.2, category: "connector" },
    { pattern: "in light of these findings", weight: 1.2, category: "connector" },
    { pattern: "taken together", weight: 1.0, category: "connector" },

    // 12. Mega Expansion (Signature AI)
    { pattern: "provides a framework for", weight: 2.0, category: "ai_mega" },
    { pattern: "implications of this research are far-reaching", weight: 2.5, category: "ai_mega" },
    { pattern: "offer valuable insight into", weight: 1.8, category: "ai_mega" },
    { pattern: "lays the groundwork for", weight: 2.5, category: "ai_mega" },
    { pattern: "timely due to", weight: 1.5, category: "ai_mega" },
    { pattern: "delve into", weight: 2.5, category: "ai_mega" },
    { pattern: "tapestry of", weight: 3.0, category: "ai_mega" },
    { pattern: "vibrant landscape", weight: 2.5, category: "ai_mega" },

    // Batch 2: Expanded Overused Phrases
    { pattern: "has attracted increasing attention", weight: 1.2, category: "intro" },
    { pattern: "become increasingly relevant", weight: 1.2, category: "intro" },
    { pattern: "due to the rapid development of", weight: 1.5, category: "intro" },
    { pattern: "phenomenon of .* has been widely discussed", weight: 1.5, category: "intro" },
    { pattern: "growing interest, .* remains underexplored", weight: 1.8, category: "gap" },
    { pattern: "consensus among scholars is that", weight: 1.5, category: "lit_review" },
    { pattern: "urgent need to investigate", weight: 2.0, category: "gap" },
    { pattern: "mixed-method approach was adopted", weight: 1.5, category: "method" },
    { pattern: "adhered to ethical standards", weight: 1.5, category: "method" },
    { pattern: "interpreted with caution", weight: 1.5, category: "limitations" },
    { pattern: "provides insight into", weight: 1.2, category: "conclusion" },

    // Batch 3: Filipino AI Cliches & Patterns (Categorized Master List)
    // A. Introduction / Panimula
    { pattern: "sa mga nakaraang taon, patuloy na lumalaki ang interes sa", weight: 1.5, category: "intro_ph" },
    { pattern: "sa mabilis na pag-unlad ng teknolohiya", weight: 2.0, category: "intro_ph" },
    { pattern: "ang pag-aaral na ito ay naglalayong suriin", weight: 1.2, category: "intro_ph" },
    { pattern: "mahalaga ang pag-unawa sa", weight: 1.0, category: "intro_ph" },
    { pattern: "ito ay isang mahalagang isyu sa larangan ng", weight: 1.2, category: "intro_ph" },
    { pattern: "sa kasalukuyang konteksto, ay nagiging napakahalaga", weight: 1.5, category: "intro_ph" },
    { pattern: "kakulangan sa pananaliksik ang naging dahilan upang", weight: 1.8, category: "intro_ph" },
    { pattern: "maraming pag-aaral ang nakatuon sa subalit", weight: 1.2, category: "intro_ph" },
    { pattern: "recent studies indicate na", weight: 2.0, category: "intro_ph" },
    { pattern: "it is widely recognized na", weight: 2.0, category: "intro_ph" },
    { pattern: "sa kabila ng lumalaking interes, nananatiling underexplored ang", weight: 1.8, category: "intro_ph" },
    { pattern: "ang pag-aaral na ito ay naglalayong punan ang kakulangan sa", weight: 2.0, category: "intro_ph" },
    { pattern: "ang phenomenon ng ay malawakang tinalakay", weight: 1.5, category: "intro_ph" },
    { pattern: "ang kahalagahan ng ay hindi matatawaran", weight: 1.5, category: "intro_ph" },
    { pattern: "sa nakalipas na dekada, maraming pag-aaral ang nakatuon sa", weight: 1.2, category: "intro_ph" },

    // B. Literature Review / Kaugnay na Pag-aaral
    { pattern: "ayon kay .* ,", weight: 0.2, category: "lit_review_ph" },
    { pattern: "ipinapakita ng mga nakaraang pag-aaral na", weight: 1.2, category: "lit_review_ph" },
    { pattern: "ipinananukala ng mga mananaliksik na", weight: 1.5, category: "lit_review_ph" },
    { pattern: "ipinapakita sa literatura na", weight: 1.5, category: "lit_review_ph" },
    { pattern: "ayon sa mga naunang pag-aaral,", weight: 1.0, category: "lit_review_ph" },
    { pattern: "maraming pag-aaral ang nagpatunay na", weight: 1.2, category: "lit_review_ph" },
    { pattern: "ipinapahiwatig ng datos na", weight: 1.5, category: "lit_review_ph" },
    { pattern: "ito ay alinsunod sa natuklasan ng", weight: 1.2, category: "lit_review_ph" },
    { pattern: "ang consensus sa pagitan ng mga scholar ay na", weight: 2.0, category: "lit_review_ph" },
    { pattern: "mga naunang pananaliksik ay nagpakita na", weight: 1.2, category: "lit_review_ph" },
    { pattern: "ang mga resulta ng pag-aaral ay sumusuporta sa", weight: 1.0, category: "lit_review_ph" },
    { pattern: "maraming mananaliksik ang nag-ulat na", weight: 1.2, category: "lit_review_ph" },
    { pattern: "ang pag-aaral na ito ay sumusunod sa framework ng", weight: 1.5, category: "lit_review_ph" },
    { pattern: "mga nakaraang literatura ay nagpapakita na", weight: 1.2, category: "lit_review_ph" },
    { pattern: "maraming ulat ang nagmumungkahi na", weight: 1.2, category: "lit_review_ph" },

    // C. Problem Statement / Suliranin
    { pattern: "gayunpaman, kakaunti pa lamang ang pananaliksik tungkol sa", weight: 1.8, category: "gap_ph" },
    { pattern: "kakaunti ang pag-aaral na tumutukoy sa", weight: 1.5, category: "gap_ph" },
    { pattern: "sa kabila ng mga naunang pag-aaral, nananatiling hindi malinaw ang", weight: 1.8, category: "gap_ph" },
    { pattern: "hindi sapat ang kasalukuyang literatura upang ipaliwanag", weight: 1.5, category: "gap_ph" },
    { pattern: "ang pag-aaral na ito ay naglalayong punan ang kakulangan sa", weight: 2.0, category: "gap_ph" },
    { pattern: "may kakulangan sa pag-unawa tungkol sa", weight: 1.5, category: "gap_ph" },
    { pattern: "isang mahalagang puwang sa pananaliksik ay", weight: 2.0, category: "gap_ph" },
    { pattern: "ang suliranin ng ay nananatiling hindi nasusuri", weight: 2.0, category: "gap_ph" },
    { pattern: "maraming katanungan ang nananatiling walang sagot sa larangan ng", weight: 1.5, category: "gap_ph" },
    { pattern: "kakaunting ebidensya ang umiiral tungkol sa", weight: 1.5, category: "gap_ph" },

    // D. Research Objectives / Layunin
    { pattern: "pangunahing layunin ng pag-aaral na ito ang", weight: 1.2, category: "layunin_ph" },
    { pattern: "ang pag-aaral na ito ay naglalayong sagutin ang mga sumusunod na tanong:", weight: 1.5, category: "layunin_ph" },
    { pattern: "tinutukoy ng pananaliksik na ito ang", weight: 1.2, category: "layunin_ph" },
    { pattern: "layunin ng pananaliksik na ito na", weight: 1.2, category: "layunin_ph" },
    { pattern: "ang pag-aaral na ito ay naglalayong suriin ang", weight: 1.2, category: "layunin_ph" },
    { pattern: "ang layunin ng pananaliksik ay tukuyin ang", weight: 1.2, category: "layunin_ph" },
    { pattern: "nais ng pag-aaral na ito na alamin ang", weight: 1.0, category: "layunin_ph" },
    { pattern: "ang layunin ng pananaliksik ay siyasatin ang", weight: 1.2, category: "layunin_ph" },
    { pattern: "ang pananaliksik na ito ay naglalayong tuklasin ang", weight: 1.2, category: "layunin_ph" },
    { pattern: "ang layunin ng pag-aaral ay magbigay ng batayan para sa", weight: 1.5, category: "layunin_ph" },

    // I. Limitations / Limitasyon at Future Research (PH)
    { pattern: "dapat bigyang-pansin na limitado ang resulta dahil sa", weight: 1.5, category: "limitations_ph" },
    { pattern: "ang pagiging pangkalahatan ay limitado dahil sa", weight: 1.5, category: "limitations_ph" },
    { pattern: "maaaring naapektuhan ang resulta ng bias", weight: 1.2, category: "limitations_ph" },
    { pattern: "dapat isama sa susunod na pag-aaral ang", weight: 1.5, category: "limitations_ph" },
    { pattern: "ang mga limitasyon ng oras at mapagkukunan ay maaaring nakaapekto sa", weight: 1.8, category: "limitations_ph" },
    { pattern: "ang maliit na bilang ng kalahok ay maaaring limitasyon ng pag-aaral", weight: 1.5, category: "limitations_ph" },
    { pattern: "ang pagkakaiba-iba ng sample ay maaaring nakaapekto sa generalizability", weight: 1.8, category: "limitations_ph" },
    { pattern: "maaaring hindi sapat ang datos upang ganap na suportahan ang konklusyon", weight: 1.5, category: "limitations_ph" },
    { pattern: "ang instrumentong ginamit ay maaaring may limitasyon sa", weight: 1.5, category: "limitations_ph" },
    { pattern: "ang kakulangan sa access sa ilang resources ay nagdulot ng limitasyon", weight: 1.5, category: "limitations_ph" },

    // J. Hedging / Neutrality (PH Expansion)
    { pattern: "maaaring ipalagay na", weight: 1.5, category: "hedging_ph" },
    { pattern: "may ebidensya na nagpapahiwatig", weight: 1.5, category: "hedging_ph" },
    { pattern: "posibleng", weight: 0.5, category: "hedging_ph" },
    { pattern: "ipinapahiwatig nito na", weight: 1.2, category: "hedging_ph" },
    { pattern: "mahalagang tandaan na", weight: 1.2, category: "hedging_ph" },
    { pattern: "dapat isaalang-alang ang karagdagang pagsusuri", weight: 1.5, category: "hedging_ph" },
    { pattern: "habang pansamantala ang mga resulta", weight: 1.5, category: "hedging_ph" },
    { pattern: "maaaring may kaugnayan sa", weight: 1.2, category: "hedging_ph" },
    { pattern: "ipinapakita ng datos ang posibilidad na", weight: 1.5, category: "hedging_ph" },
    { pattern: "hindi ganap na tiyak ngunit maaaring ipahiwatig na", weight: 1.8, category: "hedging_ph" },
    { pattern: "maaaring sabihing", weight: 1.2, category: "hedging_ph" },
    { pattern: "maaaring ipaliwanag sa pamamagitan ng", weight: 1.5, category: "hedging_ph" },
    { pattern: "maaaring maging batayan para sa", weight: 1.2, category: "hedging_ph" },
    { pattern: "ang resulta ay maaaring sumuporta sa teorya na", weight: 1.5, category: "hedging_ph" },
    { pattern: "posibleng may implikasyon sa", weight: 1.5, category: "hedging_ph" },

    // K. Transitional / Linking Phrases (PH Expansion)
    { pattern: "bukod dito,", weight: 0.5, category: "connector_ph" },
    { pattern: "dagdag pa rito,", weight: 0.5, category: "connector_ph" },
    { pattern: "higit pa rito,", weight: 0.5, category: "connector_ph" },
    { pattern: "sa kabilang banda,", weight: 0.5, category: "connector_ph" },
    { pattern: "bunga nito,", weight: 0.8, category: "connector_ph" },
    { pattern: "kaya naman,", weight: 0.8, category: "connector_ph" },
    { pattern: "samakatuwid,", weight: 0.8, category: "connector_ph" },
    { pattern: "sa kabuuan,", weight: 0.5, category: "connector_ph" },
    { pattern: "sa konteksto ng mga natuklasan,", weight: 1.2, category: "connector_ph" },
    { pattern: "tungkol dito,", weight: 0.8, category: "connector_ph" },
    { pattern: "sa aspetong ito,", weight: 1.0, category: "connector_ph" },
    { pattern: "bilang karagdagan,", weight: 0.8, category: "connector_ph" },
    { pattern: "bilang resulta,", weight: 0.8, category: "connector_ph" },
    { pattern: "sa madaling salita,", weight: 0.8, category: "connector_ph" },
    { pattern: "sa ganitong paraan,", weight: 0.8, category: "connector_ph" },

    // L. Stylistic Reinforcement / AI Filler (PH)
    { pattern: "ang pag-aaral na ito ay naglalayong magbigay ng batayan sa", weight: 1.8, category: "filler_ph" },
    { pattern: "ang mga resulta ay sumusuporta sa umiiral na teorya", weight: 1.5, category: "filler_ph" },
    { pattern: "nagbibigay ang pag-aaral ng mahalagang insight sa", weight: 1.8, category: "filler_ph" },
    { pattern: "ang pananaliksik ay nagpapakita ng kahalagahan ng", weight: 1.5, category: "filler_ph" },
    { pattern: "ang findings ay nagmumungkahi ng posibleng mekanismo sa", weight: 1.8, category: "filler_ph" },
    { pattern: "ang pag-aaral ay nagtatampok ng mga pangunahing pattern sa", weight: 1.5, category: "filler_ph" },
    { pattern: "nagbibigay ang pananaliksik ng suporta sa hypothesis na", weight: 1.5, category: "filler_ph" },
    { pattern: "ang mga natuklasan ay maaaring magamit sa pagbuo ng bagong polisiya", weight: 1.8, category: "filler_ph" },
    { pattern: "ang resulta ay nagpapakita ng pangangailangan para sa karagdagang pagsusuri", weight: 1.5, category: "filler_ph" },
    { pattern: "ang pananaliksik ay nagbibigay ng pananaw sa ugnayan ng", weight: 1.5, category: "filler_ph" },
    { pattern: "ang pag-aaral ay maaaring magsilbing batayan para sa hinaharap na pananaliksik", weight: 1.8, category: "filler_ph" },
    { pattern: "ang mga resulta ay maaaring maging gabay sa praktikal na aplikasyon", weight: 1.5, category: "filler_ph" },
    { pattern: "ang findings ay nagbibigay ng pagkakataon sa mas malalim na pagsusuri", weight: 1.5, category: "filler_ph" },
    { pattern: "ang pananaliksik ay nagpapalawak ng kasalukuyang kaalaman sa", weight: 1.8, category: "filler_ph" },
    { pattern: "ang pag-aaral na ito ay nagpapakita ng potensyal para sa pag-unlad ng", weight: 1.8, category: "filler_ph" },

    // User requested specific weight
    { pattern: "like", weight: 0.2, category: "filler" }
];

const HEDGING_WORDS = ["may", "might", "could", "possibly", "perhaps", "maybe", "suggests", "seems", "maaaring", "marahil", "tila", "parang", "siguro"];
const JARGON_WORDS = ["research", "study", "findings", "data", "analysis", "investigate", "explore", "examine", "pananaliksik", "pag-aaral", "resulta", "datos", "pagsusuri", "metodolohiya"];
const PASSIVE_VOICE_MARKERS = ["was", "were", "is", "are", "been", "being"];
const FILIPINO_AY_MARKER = "ay";
const FILIPINO_FOCUS_PREFIXES = ["ini", "isi", "ipi", "na", "ma"]; // Focus markers that look passive-ish when overused in translations

const CONTEXTUAL_TRIGGERS = [
    {
        id: "minors_protection",
        triggers: ["minors", "children", "students", "youth", "kindergarten"],
        expectations: ["consent", "parental", "guardian", "assent"],
        label: "Lacks Child Protection/Consent Protocols"
    },
    {
        id: "data_privacy",
        triggers: ["dataset", "survey", "questionnaire", "interviews", "respondents"],
        expectations: ["anonymity", "confidentiality", "privacy", "secure", "encrypted"],
        label: "Lacks Data Privacy/Anonymization Details"
    },
    {
        id: "human_subjects",
        triggers: ["participants", "subjects", "human", "respondente", "kalahok", "tao"],
        expectations: ["ethics committee", "irb", "review board", "approved", "adherence", "pahintulot", "lehitimo", "komite"],
        label: "Missing Ethical Board Approval (IRB/ERB)"
    }
];

class HeuristicsService {

    /**
     * Main Analysis Entry Point
     * @param {string} text 
     * @returns {object} Forensic Report
     */
    analyze(text) {
        if (!text) return null;

        const cleanText = this.phase1_normalize(text);

        // Parallel execution of forensic layers
        const typography = this.phase2_typography(cleanText);
        const patterns = this.phase3_weighted_patterns(cleanText);
        const omissions = this.phase4_contextual_omissions(cleanText);
        const style = this.phase6_stylistic_markers(cleanText);
        const structure = this.phase7_structure_check(text); // raw text for newlines

        // Scoring
        const scores = this.phase5_calculate_score({ typography, patterns, omissions, style, structure });

        return {
            ...scores,
            details: {
                norm_text_length: cleanText.length,
                typography,
                patterns,
                omissions,
                style,
                structure
            }
        };
    }

    // PHASE 1: NORMALIZATION
    phase1_normalize(text) {
        let clean = text.replace(/Page \d+|^\d+$/gm, ''); // Remove page numbers
        clean = clean.replace(/\r\n/g, '\n').replace(/\r/g, '\n'); // Normalize newlines
        clean = clean.replace(/\s+/g, ' ').trim(); // Collapse whitespace
        return clean;
    }

    // PHASE 2: TYPOGRAPHY (Sentence Variance)
    phase2_typography(text) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        if (sentences.length === 0) return { variance_score: 0, std_dev: 0 };

        const lengths = sentences.map(s => s.trim().split(/\s+/).length);
        const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;

        // Standard Deviation
        const squareDiffs = lengths.map(val => Math.pow(val - mean, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / lengths.length;
        const stdDev = Math.sqrt(avgSquareDiff);

        // Score: Lower stdDev (more uniform) = Higher AI Probability
        // Human writing usually has stdDev > 8-10. AI often < 5.
        // We map 0-15 scale to a 0-100 risk score (inverted).
        let riskScore = 0;
        if (stdDev < 4) riskScore = 100;
        else if (stdDev < 6) riskScore = 80;
        else if (stdDev < 8) riskScore = 50;
        else if (stdDev < 10) riskScore = 20;

        return {
            sentence_count: sentences.length,
            avg_length: parseFloat(mean.toFixed(2)),
            std_dev: parseFloat(stdDev.toFixed(2)),
            risk_score: riskScore
        };
    }

    // PHASE 3: WEIGHTED PATTERN MATCHING
    phase3_weighted_patterns(text) {
        const lower = text.toLowerCase();
        let totalScore = 0;
        const hits = [];

        PATTERN_DICTIONARY.forEach(item => {
            let regex;
            try {
                // Transform .* to non-greedy .*? for better performance and multiple hits
                const safePattern = item.pattern.replace(/\.\*/g, '.*?');

                if (safePattern.includes('.*?')) {
                    regex = new RegExp(`\\b${safePattern}\\b`, 'gi');
                } else {
                    const escapedPattern = safePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    regex = new RegExp(`\\b${escapedPattern}\\b`, 'gi');
                }
            } catch (e) {
                console.warn(`[Heuristics] Invalid regex pattern: ${item.pattern}`);
                return;
            }

            const matches = lower.match(regex);
            if (matches) {
                const count = matches.length;
                const points = count * item.weight;
                totalScore += points;
                hits.push({ pattern: item.pattern, count, points, category: item.category });
            }
        });

        // Normalize score relative to text length (per 1000 words)
        const wordCount = text.split(/\s+/).length || 1;
        const normalizedScore = (totalScore / wordCount) * 1000;

        return {
            total_weighted_points: parseFloat(totalScore.toFixed(2)),
            normalized_score: parseFloat(normalizedScore.toFixed(2)), // AI Risk Score based on patterns
            detected_patterns: hits
        };
    }

    // PHASE 4: CONTEXTUAL OMISSIONS
    phase4_contextual_omissions(text) {
        const lower = text.toLowerCase();
        const flagged = [];

        CONTEXTUAL_TRIGGERS.forEach(rule => {
            const hasTrigger = rule.triggers.some(t => lower.includes(t));
            if (hasTrigger) {
                const hasExpectation = rule.expectations.some(e => lower.includes(e));
                if (!hasExpectation) {
                    flagged.push({
                        id: rule.id,
                        label: rule.label,
                        trigger_found: rule.triggers.find(t => lower.includes(t))
                    });
                }
            }
        });

        return {
            flagged_omissions: flagged,
            count: flagged.length
        };
    }

    // PHASE 5: SCORING & AGGREGATION
    phase5_calculate_score({ typography, patterns, omissions, style, structure }) {
        // Weighted aggregation
        // 1. Typography Risk (15%)
        // 2. Pattern Risk (25%)
        // 3. Omission Risk (20%)
        // 4. Style Risk (25%) - NEW (Passive voice, hedging)
        // 5. Structure Risk (15%) - NEW

        const typoRisk = typography.risk_score;
        let patternRisk = Math.min(patterns.normalized_score * 2, 100);
        let omissionRisk = Math.min(omissions.count * 35, 100);

        // Style Risk Calculation
        let styleRisk = 0;
        if (style.passive_voice_pct > 40) styleRisk += 30; // High passive voice is AI hallmark
        if (style.filipino_ay_pct > 30) styleRisk += 30;  // High "ay" frequency in Filipino (often from translation AI)
        if (style.hedging_density > 10) styleRisk += 20;
        if (style.jargon_density > 50) styleRisk += 20; // Over-use of academic templates
        styleRisk = Math.min(styleRisk, 100);

        // Structure Risk
        let structureRisk = structure.predictability_score;

        // Final Calculation
        const finalScore =
            (typoRisk * 0.15) +
            (patternRisk * 0.25) +
            (omissionRisk * 0.20) +
            (styleRisk * 0.25) +
            (structureRisk * 0.15);

        let confidenceNode = 'Mababa'; // Risk
        if (finalScore > 75) confidenceNode = 'Mataas';
        else if (finalScore > 40) confidenceNode = 'Katamtaman';

        return {
            ai_probability_score: Math.round(finalScore), // 0-100
            ai_risk_node: confidenceNode, // Linked to Likert
            risk_breakdown: {
                typography: typoRisk,
                patterns: patternRisk,
                omissions: omissionRisk,
                style: styleRisk,
                structure: structureRisk
            }
        };
    }

    // PHASE 6: STYLISTIC MARKERS (Passive Voice, Hedging, Jargon)
    phase6_stylistic_markers(text) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        const lower = text.toLowerCase();

        // 1. Passive Voice Detection (Simplified: be-verb + past participle)
        let passiveCount = 0;
        sentences.forEach(s => {
            const sLower = s.toLowerCase();
            // Pattern: marker + [optional word] + word ending in ed
            // (e.g. "was performed", "is collected", "has been observed")
            const markers = PASSIVE_VOICE_MARKERS.join('|');
            const regex = new RegExp(`\\b(${markers})\\b(\\s+\\w+)?\\s+\\w+ed\\b`, 'i');
            if (regex.test(sLower)) passiveCount++;
        });

        const passivePct = sentences.length > 0 ? (passiveCount / sentences.length) * 100 : 0;

        // 1.1 Filipino "Ay" Structure & Focus Detection
        let ayCount = 0;
        let focusCount = 0;
        sentences.forEach(s => {
            const sLower = s.toLowerCase();
            if (sLower.includes(` ${FILIPINO_AY_MARKER} `)) ayCount++;

            // Check for overused focus prefixes in key academic verbs
            FILIPINO_FOCUS_PREFIXES.forEach(prefix => {
                const regex = new RegExp(`\\b${prefix}[a-z]+(in|an|on)\\b`, 'i');
                if (regex.test(sLower)) focusCount++;
            });
        });

        const ayPct = sentences.length > 0 ? (ayCount / sentences.length) * 100 : 0;
        const focusPct = sentences.length > 0 ? (focusCount / sentences.length) * 100 : 0;

        // 2. Hedging Density
        let hedgingCount = 0;
        HEDGING_WORDS.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = lower.match(regex);
            if (matches) hedgingCount += matches.length;
        });

        // 3. Jargon Density
        let jargonCount = 0;
        JARGON_WORDS.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = lower.match(regex);
            if (matches) jargonCount += matches.length;
        });

        const wordCount = text.split(/\s+/).length || 1;

        return {
            passive_voice_count: passiveCount,
            passive_voice_pct: parseFloat(passivePct.toFixed(2)),
            filipino_ay_pct: parseFloat(ayPct.toFixed(2)),
            filipino_focus_pct: parseFloat(focusPct.toFixed(2)),
            hedging_density: parseFloat(((hedgingCount / wordCount) * 1000).toFixed(2)), // per 1k
            jargon_density: parseFloat(((jargonCount / wordCount) * 1000).toFixed(2))
        };
    }

    // PHASE 7: SECTION STRUCTURE CHECK (Predictability)
    phase7_structure_check(text) {
        const lower = text.toLowerCase();

        // Rigid academic structure: Intro -> Lit Review -> Method -> Results -> Discussion -> Conclusion
        const sequence = ["introduction", "literature review", "methodology", "results", "discussion", "conclusion"];
        const detected = [];

        sequence.forEach(section => {
            if (lower.includes(section)) detected.push(section);
        });

        // Calculate sequence order match
        let properlyOrdered = true;
        let lastIndex = -1;
        detected.forEach(section => {
            const index = lower.indexOf(section);
            if (index < lastIndex) properlyOrdered = false;
            lastIndex = index;
        });

        // AI follows this perfectly. Humans deviate or rename.
        let predictability = 0;
        if (detected.length >= 4 && properlyOrdered) predictability = 100;
        else if (detected.length >= 4) predictability = 60;
        else if (detected.length > 0) predictability = 30;

        return {
            sections_detected: detected,
            properly_ordered: properlyOrdered,
            predictability_score: predictability
        };
    }
}

module.exports = new HeuristicsService();
