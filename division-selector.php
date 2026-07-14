<?php
/* Load Helpers */
require_once __DIR__ . '/core/helpers/functions.php';

/* Visitor Tracking */
@include_once __DIR__ . '/admin/visitors/tracker.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prime Facility Services Group - Choose Your Division</title>

    <!-- SEO Meta Tags -->
    <meta name="description" content="Select your business division: Hood System Cleaning or Hospitality Staffing & Services. Prime Facility Services Group - Houston's premier facility management partner.">
    <meta name="keywords" content="facility management Houston, hood cleaning, hospitality staffing, facility services">
    <meta name="author" content="Prime Facility Services Group">

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/logo-prime.svg">
    <link rel="apple-touch-icon" href="/logo-prime.svg">

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>

    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Montserrat', sans-serif; }

        /* ── Landing Selector ── */
        body {
            background: #03143A;
            min-height: 100svh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .landing-selector-inner {
            text-align: center;
            padding: 2rem 1rem;
            width: 100%;
            max-width: 960px;
        }

        .landing-logo {
            margin-bottom: 1.5rem;
        }

        .landing-logo img {
            height: 56px;
            width: auto;
            margin: 0 auto;
        }

        .landing-tagline {
            color: rgba(255,255,255,0.6);
            font-size: 0.875rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            margin-bottom: 2.5rem;
        }

        .landing-cards {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
        }

        @media (max-width: 600px) {
            .landing-cards { grid-template-columns: 1fr; }
        }

        .landing-card {
            position: relative;
            border-radius: 1.25rem;
            overflow: hidden;
            cursor: pointer;
            border: none;
            text-align: left;
            text-decoration: none;
            display: block;
            min-height: 340px;
            transition: transform 0.35s ease, box-shadow 0.35s ease;
        }

        .landing-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 24px 60px rgba(0,0,0,0.5);
        }

        .landing-card__bg {
            position: absolute;
            inset: 0;
            transition: transform 0.6s ease;
        }

        .landing-card:hover .landing-card__bg {
            transform: scale(1.05);
        }

        .landing-card--hood .landing-card__bg {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%);
        }

        .landing-card--hospitality .landing-card__bg {
            background: linear-gradient(135deg, #7b0a1e 0%, #C70532 50%, #e91e63 100%);
        }

        .landing-card__content {
            position: relative;
            z-index: 2;
            padding: 2.5rem 2rem;
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 340px;
        }

        .landing-card__icon {
            width: 3.5rem;
            height: 3.5rem;
            background: rgba(255,255,255,0.12);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
            backdrop-filter: blur(4px);
        }

        .landing-card__icon svg {
            width: 1.6rem;
            height: 1.6rem;
            color: #fff;
        }

        .landing-card h2 {
            font-size: 1.75rem;
            font-weight: 700;
            color: #fff;
            line-height: 1.2;
            margin-bottom: 0.875rem;
        }

        .landing-card p {
            font-size: 0.9375rem;
            color: rgba(255,255,255,0.75);
            line-height: 1.6;
            margin-bottom: auto;
            padding-bottom: 1.5rem;
        }

        .landing-card__cta {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: #fff;
            font-size: 0.875rem;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            border-bottom: 2px solid rgba(255,255,255,0.4);
            padding-bottom: 0.2rem;
            transition: border-color 0.3s ease;
        }

        .landing-card:hover .landing-card__cta {
            border-color: #fff;
        }
    </style>
</head>
<body>
    <!-- Division Selector -->
    <div class="landing-selector-inner">
        <!-- Logo -->
        <div class="landing-logo">
            <img src="./assets/logos/logo-prime-facility-white.png" alt="Prime Facility Services Group">
        </div>
        <p class="landing-tagline">Select a division to continue</p>

        <div class="landing-cards">
            <!-- Hood System Cleaning Card -->
            <a href="/primefacilityservicesgroup/hood/" class="landing-card landing-card--hood">
                <div class="landing-card__bg"></div>
                <div class="landing-card__content">
                    <div class="landing-card__icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 7h18M3 7c0 0 1-4 9-4s9 4 9 4M3 7l2 13h14l2-13"/>
                            <path d="M9 11v5M12 11v5M15 11v5"/>
                        </svg>
                    </div>
                    <h2>Hood System<br>Cleaning</h2>
                    <p>Professional kitchen exhaust hood cleaning &amp; fire suppression services</p>
                    <span class="landing-card__cta">
                        Explore Services
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </span>
                </div>
            </a>

            <!-- Hospitality Card -->
            <a href="/primefacilityservicesgroup/hospitality/" class="landing-card landing-card--hospitality">
                <div class="landing-card__bg"></div>
                <div class="landing-card__content">
                    <div class="landing-card__icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="9" cy="7" r="4"/><circle cx="17" cy="9" r="3"/>
                            <path d="M1 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/>
                            <path d="M23 21v-1.5a3 3 0 0 0-3-3h-1"/>
                        </svg>
                    </div>
                    <h2>Staffing &amp;<br>Services</h2>
                    <p>Professional staffing, cleaning, and valet services for hospitality &amp; events</p>
                    <span class="landing-card__cta">
                        Enter Site
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </span>
                </div>
            </a>
        </div>
    </div>
</body>
</html>
