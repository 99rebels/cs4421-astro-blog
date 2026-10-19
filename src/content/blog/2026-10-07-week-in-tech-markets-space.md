---
title: 'The week in tech, markets and space: 28 September – 4 October'
description: 'Two Azure outages, an exploited iPhone flaw, Nvidia’s record buyback, a weak jobs report, Starship’s first orbit and Google’s AI chips in space.'
pubDate: '2026-10-07'
author: 'rian-oleary'
tags: ['tech', 'markets', 'space', 'news']
---

Everything from last week that wasn't AI. The AI stories have
[their own post](/blog/2026-10-07-week-in-ai/).

## Tech

### Two Azure outages in two days

On 29 September, Azure OpenAI and Foundry services in Sweden Central were down for nearly six
hours after a backend metadata service started timing out. The next evening, gateway services
including ExpressRoute, VPN Gateway and Azure Firewall degraded across several regions,
including North Europe, which is Dublin.

Microsoft's review says a recent change to a gateway management service caused more load than
expected while unrelated operating-system maintenance rolled through the regions. That's a
good lesson for a DevOps module: neither the change nor the maintenance broke anything on its
own. Together, they did.
([Azure status history](https://azure.status.microsoft/en-us/status/history))

### Apple patches an exploited zero-click iPhone flaw

An emergency iOS 26 update fixes CVE-2026-86950, a bug in CoreGraphics that let a crafted
file run code without the user doing anything. Apple says it may have been exploited in a
targeted attack. Meta's security team reported it, and CISA gave US federal agencies three
days to patch.
([Computerworld](https://www.computerworld.com/article/4228858/apple-issues-urgent-ios-patch-as-it-navigates-the-spyware-arms-race.html))

### Schneider Electric buys PTC for $22.6 billion

On Monday, the French industrial group agreed an all-cash deal for PTC, the Boston-based
industrial software company. PTC's shares closed up 33% on the news.
([Boston Globe](https://www.bostonglobe.com/2026/10/05/business/schneider-electric-ptc/))

## Markets

### Nvidia approves a record $150 billion buyback

Nvidia's board added $150 billion to its share buyback programme, bringing the total to
$235 billion, the largest buyback authorisation in US corporate history.
([CNBC](https://www.cnbc.com/2026/09/28/nvidia-share-buyback-plan-gets-150-billion-boost.html),
[The Motley Fool](https://www.fool.com/investing/2026/10/01/nvidia-authorizes-a-record-235-billion-in-stock-bu/))

### A weak jobs report and a mixed week

The US added just 29,000 jobs in September against 84,000 expected, and unemployment rose to
4.2%. The Nasdaq still hit an intraday record on Friday and finished the week up 0.5%, but the
S&P 500 fell 0.3% and the Dow 1.3% over the week.
([Yahoo Finance](https://finance.yahoo.com/markets/stocks/articles/markets-news-oct-2-2026-104753291.html))

## Space

### Starship reaches orbit for the first time

On its 14th test flight, SpaceX's Starship reached orbit about 25 minutes after launch, even
after losing one of its six engines on the way up. It deployed 26 Starlink V3 satellites,
which SpaceX says is about ten times the capacity of a Falcon 9 Starlink launch. After nearly
two orbits it came down early, splashing down north of Hawaii.
([Payload](https://payloadspace.com/starship-reaches-orbit-on-14th-test-flight/),
[NPR](https://www.npr.org/2026/09/29/nx-s1-5983804/spacexs-starship-reaches-orbit-for-the-first-time))

### Google puts AI chips in orbit

Google's Project Suncatcher launched a fridge-sized prototype satellite, built with Planet
Labs, carrying four of the same TPU chips that run Gemini in its data centres. It's in orbit,
but whether the chips survived is still waiting on telemetry. The big question is heat: at
full load the chips produce more than the radiator can shed, which currently limits them to
about fifteen minutes before a cool-down.
([Tech Times](https://www.techtimes.com/articles/328471/20261002/googles-trillium-tpus-reach-orbit-radiators-must-beat-15-minute-heat-limit.htm))
