-- Create provinces table
CREATE TABLE public.provinces (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name_en text NOT NULL,
    name_si text NOT NULL,
    code text NOT NULL UNIQUE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create districts table
CREATE TABLE public.districts (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    province_id uuid NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
    name_en text NOT NULL,
    name_si text NOT NULL,
    code text NOT NULL UNIQUE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create towns table
CREATE TABLE public.towns (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    district_id uuid NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
    name_en text NOT NULL,
    name_si text NOT NULL,
    postal_code text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add location columns to salons table
ALTER TABLE public.salons ADD COLUMN province_id uuid REFERENCES public.provinces(id);
ALTER TABLE public.salons ADD COLUMN district_id uuid REFERENCES public.districts(id);
ALTER TABLE public.salons ADD COLUMN town_id uuid REFERENCES public.towns(id);

-- Create indexes for better query performance
CREATE INDEX idx_districts_province_id ON public.districts(province_id);
CREATE INDEX idx_towns_district_id ON public.towns(district_id);
CREATE INDEX idx_salons_province_id ON public.salons(province_id);
CREATE INDEX idx_salons_district_id ON public.salons(district_id);
CREATE INDEX idx_salons_town_id ON public.salons(town_id);

-- Enable RLS
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.towns ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Everyone can read location data
CREATE POLICY "Anyone can view provinces" ON public.provinces FOR SELECT USING (true);
CREATE POLICY "Anyone can view districts" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Anyone can view towns" ON public.towns FOR SELECT USING (true);

-- Only admins can manage location data
CREATE POLICY "Admins can manage provinces" ON public.provinces FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage districts" ON public.districts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage towns" ON public.towns FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed Sri Lanka Provinces (9 provinces)
INSERT INTO public.provinces (name_en, name_si, code) VALUES
('Western', 'බස්නාහිර', 'WP'),
('Southern', 'දකුණු', 'SP'),
('Central', 'මධ්‍යම', 'CP'),
('Northern', 'උතුරු', 'NP'),
('Eastern', 'නැගෙනහිර', 'EP'),
('North Western', 'වයඹ', 'NWP'),
('North Central', 'උතුරු මැද', 'NCP'),
('Uva', 'ඌව', 'UP'),
('Sabaragamuwa', 'සබරගමුව', 'SGP');

-- Seed Districts (25 districts)
-- Western Province
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Colombo', 'කොළඹ', 'CMB' FROM public.provinces WHERE code = 'WP';
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Gampaha', 'ගම්පහ', 'GMP' FROM public.provinces WHERE code = 'WP';
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Kalutara', 'කළුතර', 'KLT' FROM public.provinces WHERE code = 'WP';

-- Southern Province
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Galle', 'ගාල්ල', 'GLL' FROM public.provinces WHERE code = 'SP';
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Matara', 'මාතර', 'MTR' FROM public.provinces WHERE code = 'SP';
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Hambantota', 'හම්බන්තොට', 'HBT' FROM public.provinces WHERE code = 'SP';

-- Central Province
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Kandy', 'මහනුවර', 'KDY' FROM public.provinces WHERE code = 'CP';
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Matale', 'මාතලේ', 'MTL' FROM public.provinces WHERE code = 'CP';
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Nuwara Eliya', 'නුවරඑළිය', 'NWE' FROM public.provinces WHERE code = 'CP';

-- Northern Province
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Jaffna', 'යාපනය', 'JFN' FROM public.provinces WHERE code = 'NP';
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Kilinochchi', 'කිලිනොච්චි', 'KLN' FROM public.provinces WHERE code = 'NP';
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Mannar', 'මන්නාරම', 'MNR' FROM public.provinces WHERE code = 'NP';
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Mullaitivu', 'මුලතිව්', 'MLT' FROM public.provinces WHERE code = 'NP';
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Vavuniya', 'වව්නියාව', 'VVN' FROM public.provinces WHERE code = 'NP';

-- Eastern Province
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Ampara', 'අම්පාර', 'AMP' FROM public.provinces WHERE code = 'EP';
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Batticaloa', 'මඩකලපුව', 'BTL' FROM public.provinces WHERE code = 'EP';
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Trincomalee', 'ත්‍රිකුණාමලය', 'TRC' FROM public.provinces WHERE code = 'EP';

-- North Western Province
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Kurunegala', 'කුරුණෑගල', 'KRN' FROM public.provinces WHERE code = 'NWP';
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Puttalam', 'පුත්තලම', 'PTL' FROM public.provinces WHERE code = 'NWP';

-- North Central Province
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Anuradhapura', 'අනුරාධපුර', 'ANP' FROM public.provinces WHERE code = 'NCP';
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Polonnaruwa', 'පොළොන්නරුව', 'PLN' FROM public.provinces WHERE code = 'NCP';

-- Uva Province
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Badulla', 'බදුල්ල', 'BDL' FROM public.provinces WHERE code = 'UP';
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Monaragala', 'මොණරාගල', 'MNG' FROM public.provinces WHERE code = 'UP';

-- Sabaragamuwa Province
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Kegalle', 'කෑගල්ල', 'KGL' FROM public.provinces WHERE code = 'SGP';
INSERT INTO public.districts (province_id, name_en, name_si, code)
SELECT id, 'Ratnapura', 'රත්නපුර', 'RTP' FROM public.provinces WHERE code = 'SGP';

-- Seed Towns for each district
-- Colombo District Towns
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Colombo', 'කොළඹ', '00100' FROM public.districts WHERE code = 'CMB';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Dehiwala', 'දෙහිවල', '10350' FROM public.districts WHERE code = 'CMB';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Moratuwa', 'මොරටුව', '10400' FROM public.districts WHERE code = 'CMB';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Nugegoda', 'නුගේගොඩ', '10250' FROM public.districts WHERE code = 'CMB';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Maharagama', 'මහරගම', '10280' FROM public.districts WHERE code = 'CMB';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Piliyandala', 'පිළියන්දල', '10300' FROM public.districts WHERE code = 'CMB';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Kotte', 'කෝට්ටේ', '10100' FROM public.districts WHERE code = 'CMB';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Battaramulla', 'බත්තරමුල්ල', '10120' FROM public.districts WHERE code = 'CMB';

-- Gampaha District Towns
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Gampaha', 'ගම්පහ', '11000' FROM public.districts WHERE code = 'GMP';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Negombo', 'මීගමුව', '11500' FROM public.districts WHERE code = 'GMP';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Wattala', 'වත්තල', '11300' FROM public.districts WHERE code = 'GMP';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Kelaniya', 'කැළණිය', '11600' FROM public.districts WHERE code = 'GMP';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Ja-Ela', 'ජා-ඇල', '11350' FROM public.districts WHERE code = 'GMP';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Kadawatha', 'කඩවත', '11850' FROM public.districts WHERE code = 'GMP';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Minuwangoda', 'මිනුවන්ගොඩ', '11550' FROM public.districts WHERE code = 'GMP';

-- Kalutara District Towns
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Kalutara', 'කළුතර', '12000' FROM public.districts WHERE code = 'KLT';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Panadura', 'පානදුර', '12500' FROM public.districts WHERE code = 'KLT';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Horana', 'හොරණ', '12400' FROM public.districts WHERE code = 'KLT';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Beruwala', 'බේරුවල', '12070' FROM public.districts WHERE code = 'KLT';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Bandaragama', 'බණ්ඩාරගම', '12530' FROM public.districts WHERE code = 'KLT';

-- Galle District Towns
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Galle', 'ගාල්ල', '80000' FROM public.districts WHERE code = 'GLL';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Hikkaduwa', 'හික්කඩුව', '80240' FROM public.districts WHERE code = 'GLL';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Ambalangoda', 'අම්බලන්ගොඩ', '80300' FROM public.districts WHERE code = 'GLL';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Elpitiya', 'ඇල්පිටිය', '80400' FROM public.districts WHERE code = 'GLL';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Karapitiya', 'කරාපිටිය', '80000' FROM public.districts WHERE code = 'GLL';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Unawatuna', 'උනවටුන', '80600' FROM public.districts WHERE code = 'GLL';

-- Matara District Towns
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Matara', 'මාතර', '81000' FROM public.districts WHERE code = 'MTR';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Weligama', 'වැලිගම', '81700' FROM public.districts WHERE code = 'MTR';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Dikwella', 'දික්වැල්ල', '81200' FROM public.districts WHERE code = 'MTR';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Deniyaya', 'දෙනියාය', '81500' FROM public.districts WHERE code = 'MTR';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Akuressa', 'අකුරැස්ස', '81400' FROM public.districts WHERE code = 'MTR';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Mirissa', 'මිරිස්ස', '81740' FROM public.districts WHERE code = 'MTR';

-- Hambantota District Towns (including Sooriyawewa!)
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Hambantota', 'හම්බන්තොට', '82000' FROM public.districts WHERE code = 'HBT';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Tangalle', 'තංගල්ල', '82200' FROM public.districts WHERE code = 'HBT';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Sooriyawewa', 'සූරියවැව', '82600' FROM public.districts WHERE code = 'HBT';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Tissamaharama', 'තිස්සමහාරාමය', '82600' FROM public.districts WHERE code = 'HBT';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Ambalantota', 'අම්බලන්තොට', '82100' FROM public.districts WHERE code = 'HBT';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Weeraketiya', 'වීරකැටිය', '82500' FROM public.districts WHERE code = 'HBT';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Beliatta', 'බෙලිඅත්ත', '82400' FROM public.districts WHERE code = 'HBT';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Kataragama', 'කතරගම', '91400' FROM public.districts WHERE code = 'HBT';

-- Kandy District Towns
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Kandy', 'මහනුවර', '20000' FROM public.districts WHERE code = 'KDY';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Peradeniya', 'පේරාදෙණිය', '20400' FROM public.districts WHERE code = 'KDY';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Katugastota', 'කටුගස්තොට', '20800' FROM public.districts WHERE code = 'KDY';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Gampola', 'ගම්පොළ', '20500' FROM public.districts WHERE code = 'KDY';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Nawalapitiya', 'නාවලපිටිය', '20650' FROM public.districts WHERE code = 'KDY';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Kadugannawa', 'කඩුගන්නාව', '20100' FROM public.districts WHERE code = 'KDY';

-- Matale District Towns
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Matale', 'මාතලේ', '21000' FROM public.districts WHERE code = 'MTL';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Dambulla', 'දඹුල්ල', '21100' FROM public.districts WHERE code = 'MTL';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Sigiriya', 'සීගිරිය', '21120' FROM public.districts WHERE code = 'MTL';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Rattota', 'රත්තොට', '21300' FROM public.districts WHERE code = 'MTL';

-- Nuwara Eliya District Towns
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Nuwara Eliya', 'නුවරඑළිය', '22200' FROM public.districts WHERE code = 'NWE';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Hatton', 'හැටන්', '22000' FROM public.districts WHERE code = 'NWE';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Talawakele', 'තලවාකැලේ', '22100' FROM public.districts WHERE code = 'NWE';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Bandarawela', 'බණ්ඩාරවෙල', '90100' FROM public.districts WHERE code = 'NWE';

-- Jaffna District Towns
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Jaffna', 'යාපනය', '40000' FROM public.districts WHERE code = 'JFN';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Chavakachcheri', 'චාවකච්චේරි', '40000' FROM public.districts WHERE code = 'JFN';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Point Pedro', 'පේදුරුතුඩුව', '40000' FROM public.districts WHERE code = 'JFN';

-- Other Northern Districts
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Kilinochchi', 'කිලිනොච්චි', '44000' FROM public.districts WHERE code = 'KLN';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Mannar', 'මන්නාරම', '41000' FROM public.districts WHERE code = 'MNR';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Mullaitivu', 'මුලතිව්', '42000' FROM public.districts WHERE code = 'MLT';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Vavuniya', 'වව්නියාව', '43000' FROM public.districts WHERE code = 'VVN';

-- Eastern Province Towns
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Ampara', 'අම්පාර', '32000' FROM public.districts WHERE code = 'AMP';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Kalmunai', 'කල්මුනේ', '32300' FROM public.districts WHERE code = 'AMP';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Batticaloa', 'මඩකලපුව', '30000' FROM public.districts WHERE code = 'BTL';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Trincomalee', 'ත්‍රිකුණාමලය', '31000' FROM public.districts WHERE code = 'TRC';

-- North Western Province Towns
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Kurunegala', 'කුරුණෑගල', '60000' FROM public.districts WHERE code = 'KRN';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Kuliyapitiya', 'කුලියාපිටිය', '60200' FROM public.districts WHERE code = 'KRN';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Wariyapola', 'වාරියපොළ', '60400' FROM public.districts WHERE code = 'KRN';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Puttalam', 'පුත්තලම', '61300' FROM public.districts WHERE code = 'PTL';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Chilaw', 'හලාවත', '61000' FROM public.districts WHERE code = 'PTL';

-- North Central Province Towns
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Anuradhapura', 'අනුරාධපුර', '50000' FROM public.districts WHERE code = 'ANP';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Mihintale', 'මිහින්තලේ', '50300' FROM public.districts WHERE code = 'ANP';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Polonnaruwa', 'පොළොන්නරුව', '51000' FROM public.districts WHERE code = 'PLN';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Medirigiriya', 'මැදිරිගිරිය', '51500' FROM public.districts WHERE code = 'PLN';

-- Uva Province Towns
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Badulla', 'බදුල්ල', '90000' FROM public.districts WHERE code = 'BDL';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Ella', 'ඇල්ල', '90090' FROM public.districts WHERE code = 'BDL';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Haputale', 'හාපුතලේ', '90160' FROM public.districts WHERE code = 'BDL';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Welimada', 'වැලිමඩ', '90200' FROM public.districts WHERE code = 'BDL';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Monaragala', 'මොණරාගල', '91000' FROM public.districts WHERE code = 'MNG';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Wellawaya', 'වැල්ලවාය', '91200' FROM public.districts WHERE code = 'MNG';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Buttala', 'බුත්තල', '91100' FROM public.districts WHERE code = 'MNG';

-- Sabaragamuwa Province Towns
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Kegalle', 'කෑගල්ල', '71000' FROM public.districts WHERE code = 'KGL';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Mawanella', 'මාවනැල්ල', '71500' FROM public.districts WHERE code = 'KGL';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Rambukkana', 'රඹුක්කන', '71100' FROM public.districts WHERE code = 'KGL';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Ratnapura', 'රත්නපුර', '70000' FROM public.districts WHERE code = 'RTP';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Balangoda', 'බලංගොඩ', '70100' FROM public.districts WHERE code = 'RTP';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Embilipitiya', 'ඇඹිලිපිටිය', '70200' FROM public.districts WHERE code = 'RTP';
INSERT INTO public.towns (district_id, name_en, name_si, postal_code)
SELECT id, 'Pelmadulla', 'පැල්මඩුල්ල', '70500' FROM public.districts WHERE code = 'RTP';