-- Migration: Río Pilot Seed - Alegría and Ecovilla
-- Description: Seeds the rio_configurations table for initial pilot tenants.
-- Timestamp: 20260319030000

INSERT INTO public.rio_configurations (
    tenant_id, 
    prompt_community_name, 
    prompt_persona, 
    prompt_language, 
    llm_model, 
    metadata
)
VALUES 
(
    '65239e2f-5f80-4960-9112-706509172449',
    'Alegría Village',
    'friendly',
    'es',
    'gemini-flash',
    '{
        "community_context": "Alegría Village is an international, ecological neighborhood in San Mateo focused on regenerative living, Earth Care, and People Care. Amenities include a Yoga Shala, Coworking Hub, and a communal permaculture farm. It represents a multi-generational community of over 135 neighbors across 70 hectares of reforested hillside.",
        "community_context_es": "Alegría Village es un barrio ecológico internacional en San Mateo enfocado en la vida regenerativa, el cuidado de la Tierra y el cuidado de las personas. Las comodidades incluyen una Shala de Yoga, un Coworking Hub y una granja de permacultura comunal. Representa una comunidad multigeneracional de más de 135 vecinos en 70 hectáreas de colinas reforestadas."
    }'::jsonb
),
(
    '0cfc777f-5798-470d-a2ad-c8573eceba7e',
    'Ecovilla San Mateo',
    'friendly',
    'es',
    'gemini-flash',
    '{
        "community_context": "Ecovilla San Mateo is a regenerative ecovillage designed for harmony with nature and strong human connections. It is planned for 300 families across 6 neighborhoods. Key features include the \"Rancho\" (communal house) with coworking and a semi-olympic pool. The community aims for 100% renewable energy and 100% food production on-site.",
        "community_context_es": "Ecovilla San Mateo es una eco-aldea regenerativa diseñada para la armonía con la naturaleza y fuertes conexiones humanas. Está planificada para 300 familias en 6 vecindarios. Las características clave incluyen el \"Rancho\" (casa comunal) con coworking y una piscina semi-olímpica. La comunidad aspira al 100% de energía renovable y al 100% de producción de alimentos en el sitio."
    }'::jsonb
)
ON CONFLICT (tenant_id) DO UPDATE SET
    prompt_community_name = EXCLUDED.prompt_community_name,
    metadata = rio_configurations.metadata || EXCLUDED.metadata,
    updated_at = now();
