import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { photo_id, photo_url } = body;

    if (!photo_id || !photo_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: photo_id, photo_url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();

    // TODO: Integrate with actual AI service (OpenAI Vision API, AWS Rekognition, etc.)
    // For now, return mock analysis data
    const mockAnalysis = {
      facial_landmarks: {
        left_eye: { x: 120, y: 150 },
        right_eye: { x: 180, y: 150 },
        nose: { x: 150, y: 180 },
        mouth_left: { x: 130, y: 210 },
        mouth_right: { x: 170, y: 210 },
        chin: { x: 150, y: 240 },
      },
      symmetry_score: 0.87,
      skin_texture_score: 0.72,
      skin_tone_analysis: {
        tone: 'medium',
        uniformity: 0.68,
        redness: 0.15,
        hyperpigmentation: 0.22,
      },
      volume_assessment: {
        cheeks: 'adequate',
        temples: 'mild_volume_loss',
        under_eyes: 'moderate_hollowing',
        jawline: 'well_defined',
      },
      wrinkle_mapping: {
        forehead: { severity: 'moderate', depth_mm: 1.2 },
        glabella: { severity: 'mild', depth_mm: 0.8 },
        crows_feet: { severity: 'moderate', depth_mm: 1.0 },
        nasolabial_folds: { severity: 'moderate', depth_mm: 1.5 },
      },
      age_estimation: 42,
      skin_quality_score: 0.75,
      detected_concerns: [
        'Fine lines around eyes',
        'Volume loss in temples',
        'Mild skin texture irregularity',
      ],
      treatment_recommendations: [
        'Botox for forehead lines and crows feet',
        'Dermal filler for temple volume',
        'Skincare regimen for texture improvement',
      ],
    };

    const processingDuration = Date.now() - startTime;

    const { data, error } = await supabase
      .from('aesthetic_photo_ai_analysis')
      .insert({
        photo_id,
        analysis_version: '1.0',
        facial_landmarks: mockAnalysis.facial_landmarks,
        symmetry_score: mockAnalysis.symmetry_score,
        skin_texture_score: mockAnalysis.skin_texture_score,
        skin_tone_analysis: mockAnalysis.skin_tone_analysis,
        volume_assessment: mockAnalysis.volume_assessment,
        wrinkle_mapping: mockAnalysis.wrinkle_mapping,
        age_estimation: mockAnalysis.age_estimation,
        skin_quality_score: mockAnalysis.skin_quality_score,
        detected_concerns: mockAnalysis.detected_concerns,
        treatment_recommendations: mockAnalysis.treatment_recommendations,
        processing_duration_ms: processingDuration,
        analysis_metadata: { model: 'mock-v1', confidence: 0.85 },
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});