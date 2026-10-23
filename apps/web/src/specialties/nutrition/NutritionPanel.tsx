import { useState } from 'react';
import { Card, Typography, Row, Col, InputNumber, Select, Slider, Checkbox, Space, Tag } from 'antd';
import type { SpecialtyComponentProps } from '../types';

const { Text } = Typography;

export function NutritionPanel({ readonly = false }: SpecialtyComponentProps) {
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(78);
  const [age, setAge] = useState<number>(32);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [activityFactor, setActivityFactor] = useState<number>(1.375);

  const [carbPercent, setCarbPercent] = useState<number>(45);
  const [proteinPercent, setProteinPercent] = useState<number>(25);
  const [fatPercent, setFatPercent] = useState<number>(30);

  const [caloricAdjustment, setCaloricAdjustment] = useState<number>(-300);
  const [waterGoalLiters, setWaterGoalLiters] = useState<number>(2.5);
  const [restrictions, setRestrictions] = useState<string[]>([]);

  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? +(weightKg / (heightM * heightM)).toFixed(1) : 0;

  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: 'Underweight', color: 'orange' };
    if (val < 25.0) return { label: 'Normal / Healthy', color: 'green' };
    if (val < 30.0) return { label: 'Overweight', color: 'gold' };
    if (val < 35.0) return { label: 'Obese (Class I)', color: 'volcano' };
    return { label: 'Severe Obesity (Class II/III)', color: 'red' };
  };

  const bmr = Math.round(
    gender === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  );

  const tdee = Math.round(bmr * activityFactor);
  const targetCalories = Math.max(1200, tdee + caloricAdjustment);

  const carbGrams = Math.round((targetCalories * (carbPercent / 100)) / 4);
  const proteinGrams = Math.round((targetCalories * (proteinPercent / 100)) / 4);
  const fatGrams = Math.round((targetCalories * (fatPercent / 100)) / 9);

  const bmiCat = getBmiCategory(bmi);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Anthropometric & Metabolic Card */}
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Anthropometric &amp; Energy Baselines</span>
            <Space>
              <Tag color={bmiCat.color}>BMI {bmi} · {bmiCat.label}</Tag>
              <Tag color="blue">TDEE: {tdee} kcal/day</Tag>
            </Space>
          </div>
        }
      >
        <Row gutter={[16, 12]}>
          <Col span={6}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Height (cm)</Text>
            <InputNumber
              style={{ width: '100%' }}
              min={50}
              max={250}
              value={heightCm}
              onChange={(v) => v && setHeightCm(v)}
              disabled={readonly}
              addonAfter="cm"
            />
          </Col>
          <Col span={6}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Weight (kg)</Text>
            <InputNumber
              style={{ width: '100%' }}
              min={20}
              max={300}
              step={0.1}
              value={weightKg}
              onChange={(v) => v && setWeightKg(v)}
              disabled={readonly}
              addonAfter="kg"
            />
          </Col>
          <Col span={6}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Gender &amp; Age</Text>
            <Space style={{ width: '100%' }}>
              <Select
                value={gender}
                onChange={setGender}
                disabled={readonly}
                style={{ width: 90 }}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ]}
              />
              <InputNumber
                min={5}
                max={120}
                value={age}
                onChange={(v) => v && setAge(v)}
                disabled={readonly}
                style={{ width: 70 }}
              />
            </Space>
          </Col>
          <Col span={6}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Activity Level</Text>
            <Select
              style={{ width: '100%' }}
              value={activityFactor}
              onChange={setActivityFactor}
              disabled={readonly}
              options={[
                { value: 1.2, label: 'Sedentary (desk job)' },
                { value: 1.375, label: 'Lightly active (1-3 d/wk)' },
                { value: 1.55, label: 'Moderately active (3-5 d/wk)' },
                { value: 1.725, label: 'Very active (6-7 d/wk)' },
                { value: 1.9, label: 'Extremely active (athlete)' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* Target Macros & Calories */}
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Target Energy &amp; Macronutrient Prescription</span>
            <Tag color="cyan" style={{ fontSize: 13, padding: '2px 8px' }}>
              Target: {targetCalories} kcal/day
            </Tag>
          </div>
        }
      >
        <Row gutter={[24, 16]}>
          <Col span={12}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12 }}>Carbohydrates ({carbPercent}% · {carbGrams}g)</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{Math.round(carbGrams * 4)} kcal</Text>
              </div>
              <Slider
                min={10}
                max={70}
                step={5}
                value={carbPercent}
                onChange={setCarbPercent}
                disabled={readonly}
                trackStyle={{ backgroundColor: '#1D4ED8' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12 }}>Protein ({proteinPercent}% · {proteinGrams}g)</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{Math.round(proteinGrams * 4)} kcal</Text>
              </div>
              <Slider
                min={10}
                max={50}
                step={5}
                value={proteinPercent}
                onChange={setProteinPercent}
                disabled={readonly}
                trackStyle={{ backgroundColor: '#047857' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12 }}>Fat ({fatPercent}% · {fatGrams}g)</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{Math.round(fatGrams * 9)} kcal</Text>
              </div>
              <Slider
                min={10}
                max={50}
                step={5}
                value={fatPercent}
                onChange={setFatPercent}
                disabled={readonly}
                trackStyle={{ backgroundColor: '#F59E0B' }}
              />
            </div>
          </Col>

          <Col span={12}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Energy Goal Adjustment
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={caloricAdjustment}
                  onChange={setCaloricAdjustment}
                  disabled={readonly}
                  options={[
                    { value: -500, label: 'Weight Loss (-500 kcal/day · ~0.5kg/wk)' },
                    { value: -300, label: 'Moderate Fat Loss (-300 kcal/day)' },
                    { value: 0, label: 'Weight Maintenance (0 kcal/day)' },
                    { value: 250, label: 'Lean Mass Gain (+250 kcal/day)' },
                    { value: 500, label: 'Hypertrophy Surplus (+500 kcal/day)' },
                  ]}
                />
              </div>

              <div>
                <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Daily Hydration Target
                </Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={6}
                  step={0.25}
                  value={waterGoalLiters}
                  onChange={(v) => v && setWaterGoalLiters(v)}
                  disabled={readonly}
                  addonAfter="Liters / day"
                />
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Dietary Restrictions Checklist */}
      <Card size="small" title="Dietary Restrictions &amp; Protocols">
        <Checkbox.Group
          value={restrictions}
          onChange={(vals) => setRestrictions(vals as string[])}
          disabled={readonly}
          style={{ width: '100%' }}
        >
          <Row gutter={[16, 8]}>
            <Col span={6}><Checkbox value="lactose_free">Lactose-Free</Checkbox></Col>
            <Col span={6}><Checkbox value="gluten_free">Gluten-Free (Celiac/NCGS)</Checkbox></Col>
            <Col span={6}><Checkbox value="low_fodmap">Low-FODMAP (IBS Protocol)</Checkbox></Col>
            <Col span={6}><Checkbox value="diabetic">Diabetic / Low Glycemic</Checkbox></Col>
            <Col span={6}><Checkbox value="renal">Renal Protocol (Low Na/K/P)</Checkbox></Col>
            <Col span={6}><Checkbox value="intermittent_fasting">16:8 Intermittent Fasting</Checkbox></Col>
            <Col span={6}><Checkbox value="vegetarian">Vegetarian / Plant-Based</Checkbox></Col>
            <Col span={6}><Checkbox value="keto">Ketogenic Therapy</Checkbox></Col>
          </Row>
        </Checkbox.Group>
      </Card>
    </div>
  );
}
