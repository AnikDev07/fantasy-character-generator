import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Curated cartoon / video game portraits mapping by class
const CARTOON_PORTRAITS: Record<string, string[]> = {
  Warrior: ['/images/cartoon_warrior_1792583221121.jpg'],
  Mage: ['/images/cartoon_mage_1792583222140.jpg'],
  Rogue: ['/images/cartoon_rogue_1792583222966.jpg'],
  Ranger: ['/images/cartoon_ranger_1792583222402.jpg'],
  Cleric: ['/images/cartoon_cleric_1792583222541.jpg'],
  Paladin: ['/images/cartoon_warrior_1792583221121.jpg'],
  Necromancer: ['/images/cartoon_mage_1792583222140.jpg', '/images/cartoon_rogue_1792583222966.jpg'],
  Bard: ['/images/cartoon_rogue_1792583222966.jpg', '/images/cartoon_ranger_1792583222402.jpg'],
};

// API Route to generate or regenerate cartoon/video game portrait
app.post('/api/generate-portrait', async (req: Request, res: Response) => {
  try {
    const { characterName, classType, lineage, style = 'cartoon_videogame', seed } = req.body;

    const classKey = (classType as string) || 'Warrior';
    const fallbackList = CARTOON_PORTRAITS[classKey] || CARTOON_PORTRAITS.Warrior;
    const selectedFallback = fallbackList[Math.floor(Math.random() * fallbackList.length)];

    // If Gemini API Key is configured, attempt live generation
    if (process.env.GEMINI_API_KEY) {
      try {
        const promptText = `Vibrant colorful cartoon video game character portrait of ${characterName}, a fantasy ${lineage} ${classType}. Stylized video game RPG art style, bold outlines, expressive animated face, cel-shaded lighting, character avatar badge, saturated palette.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: promptText }],
          },
          config: {
            imageConfig: {
              aspectRatio: '1:1',
            },
          },
        });

        const candidates = response.candidates;
        if (candidates && candidates[0]?.content?.parts) {
          for (const part of candidates[0].content.parts) {
            if (part.inlineData?.data) {
              const mime = part.inlineData.mimeType || 'image/png';
              const dataUrl = `data:${mime};base64,${part.inlineData.data}`;
              return res.json({
                success: true,
                image: dataUrl,
                source: 'gemini-live',
                style,
              });
            }
          }
        }
      } catch (geminiError) {
        // Fall through gracefully to curated video game art
        console.warn('Gemini live image generation skipped, using high-fidelity cartoon asset:', geminiError);
      }
    }

    // Return the curated cartoon/video game art
    return res.json({
      success: true,
      image: selectedFallback,
      source: 'curated-game-art',
      style,
      seed: seed || Date.now(),
    });
  } catch (error) {
    console.error('Error generating portrait:', error);
    return res.status(500).json({ error: 'Failed to generate portrait' });
  }
});

// API Route to generate or regenerate unique 1-2 sentence origin story
app.post('/api/generate-backstory', async (req: Request, res: Response) => {
  try {
    const { characterName, title, classType, lineage, homeland, weapon, quirk, level } = req.body;

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `Write a unique, compelling, and atmospheric origin story for this fantasy adventurer:
Name: ${characterName} ${title || ''}
Class: Level ${level || 3} ${classType}
Lineage: ${lineage}
Homeland: ${homeland}
Weapon: ${weapon}
Personal Quirk: ${quirk}

Rules:
1. Must be strictly 1 to 2 sentences long.
2. High-fantasy tone with poetic, immersive prose.
3. No quote marks around the whole sentence, no markdown headers or bullets.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const storyText = response.text?.trim();
        if (storyText && storyText.length > 20) {
          // Clean any stray outer quotes
          const cleaned = storyText.replace(/^["']|["']$/g, '').trim();
          return res.json({
            success: true,
            backstory: cleaned,
            source: 'gemini',
          });
        }
      } catch (geminiError) {
        console.warn('Gemini backstory API call skipped, using procedural lore generator:', geminiError);
      }
    }

    // Procedural fallback
    const fallbackTemplates = [
      `Raised beneath the shadowed eaves of ${homeland}, ${characterName} took up the discipline of the ${classType} after uncovering an arcane relic etched with forgotten prophecy. Now bearing their trusted ${weapon}, they journey across Avalon with an unyielding vow never to break their word.`,
      `An exile from high court conspiracies in ${homeland}, ${characterName} ${title || ''} learned that salvation lies not in ancestral crowns, but in the sharp edge of a ${weapon}. Their comrades know them as a stalwart ${classType}, though ${quirk ? quirk.charAt(0).toLowerCase() + quirk.slice(1) : 'they keep their deepest thoughts to themselves.'}`,
      `When catastrophe struck the sanctuary of ${homeland}, ${characterName} was chosen by the elder spirits to wield the mantle of the ${classType}. Armed with a ${weapon}, they roam the frontiers seeking to restore honor to their lineage.`,
      `Born beneath a rare celestial omen over ${homeland}, ${characterName} displayed an uncanny affinity for ${classType} arts before even coming of age. Today they navigate dangerous ruins with a ${weapon} in hand, guided by ancient lore and an unbreakable spirit.`,
      `Trained in the austere martial cloisters of ${homeland}, ${characterName} mastered the ${weapon} under the watchful gaze of hermit sages. While their reputation as ${title || 'the Wanderer'} precedes them into every tavern, ${quirk ? quirk.charAt(0).toLowerCase() + quirk.slice(1) : 'they remain enigmatic.'}`,
      `After deciphering a forbidden grimoire in the catacombs of ${homeland}, ${characterName} swore themselves to the craft of the ${classType}. Though foes dread the fury of their ${weapon}, allies cherish their quiet loyalty in the face of peril.`
    ];

    const fallbackStory = fallbackTemplates[Math.floor(Math.random() * fallbackTemplates.length)];
    return res.json({
      success: true,
      backstory: fallbackStory,
      source: 'procedural',
    });
  } catch (error) {
    console.error('Error in /api/generate-backstory:', error);
    return res.status(500).json({ error: 'Failed to generate backstory' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
