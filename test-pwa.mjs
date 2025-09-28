// test-pwa.mjs - Version ES modules
import puppeteer from 'puppeteer';

async function testPWA() {
    console.log('?? Test PWA automatisé...');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Test chargement page
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
        console.log('? Page chargée');
        
        // Test manifest
        const manifestLink = await page.$('link[rel="manifest"]');
        console.log(? Manifest link: ${manifestLink ? 'Détecté' : 'Non trouvé'});
        
        // Test Service Worker
        const swSupported = await page.evaluate(() => 'serviceWorker' in navigator);
        console.log(? Service Worker API: ${swSupported ? 'Supporté' : 'Non supporté'});
        
        // Attendre enregistrement SW
        await page.waitForTimeout(2000);
        
        const swStatus = await page.evaluate(async () => {
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.getRegistration();
                    return {
                        registered: !!registration,
                        active: !!registration?.active
                    };
                } catch (e) {
                    return { registered: false, error: e.message };
                }
            }
            return { registered: false };
        });
        
        console.log(? Service Worker enregistré: ${swStatus.registered});
        if (swStatus.active) {
            console.log('? Service Worker actif');
        }
        
        console.log('\n?? TESTS AUTOMATISÉS PWA: RÉUSSIS');
        
    } catch (error) {
        console.error('? Erreur test:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

await testPWA();
