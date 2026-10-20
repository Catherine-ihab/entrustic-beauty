import { useState } from 'react';
import { Table, Button, Tag, Modal, Typography, Timeline, Card, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { IVisit } from '@clinic/shared-types';
import { FilePlus, History, ExternalLink } from 'lucide-react';
import dayjs from 'dayjs';
import { VisitWorkspace } from '../visits/VisitWorkspace';

const { Title, Text } = Typography;

export function RecordsView() {
  const { t } = useTranslation();
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [activeVisitId, setActiveVisitId] = useState<string | undefined>(undefined);
  const [selectedVisit, setSelectedVisit] = useState<IVisit | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [visits] = useState<IVisit[]>([
    {
      id: 'v-1',
      clinicId: 'demo',
      patientId: 'p-1',
      providerId: 'doc-1',
      originalVisitDate: dayjs().subtract(2, 'day').toISOString(),
      status: 'amended',
      currentVersion: 2,
      createdAt: dayjs().subtract(2, 'day').toISOString(),
      updatedAt: dayjs().toISOString(),
      versions: [
        {
          id: 'ver-1',
          clinicId: 'demo',
          visitId: 'v-1',
          versionNumber: 1,
          chiefComplaint: 'Dynamic forehead lines, glabella frown expression and crow’s feet',
          diagnosis: 'Dynamic upper facial rhytids (Glogau II) - Fitzpatrick Skin Phototype III',
          treatmentPlan: 'Reconstituted OnabotulinumtoxinA (Botox): 20U Glabella, 10U Frontalis, 12U bilateral crow’s feet. Post-care instructions provided via WhatsApp.',
          clinicalNotes: 'Cleaned with chlorhexidine. Administered with 32G nano-needle without bruising.',
          changeReason: 'Initial consultation record',
          changedBy: 'Dr. Mariam',
          changedAt: dayjs().subtract(2, 'day').toISOString(),
        },
        {
          id: 'ver-2',
          clinicId: 'demo',
          visitId: 'v-1',
          versionNumber: 2,
          chiefComplaint: '2-week post-injection evaluation & touch-up review',
          diagnosis: 'Satisfactory muscle relaxation achieved; minor asymmetry in left lateral frontalis',
          treatmentPlan: 'Administered 2U touch-up to left frontalis. Next full session planned in 4-5 months.',
          clinicalNotes: 'Natural resting tone restored, excellent patient satisfaction.',
          changeReason: 'Diagnostic re-evaluation following 2-week follow-up review',
          changedBy: 'Dr. Mariam',
          changedAt: dayjs().toISOString(),
        },
      ],
    },
  ]);

  if (isWorkspaceOpen) {
    return (
      <VisitWorkspace
        patientId="p-1"
        visitId={activeVisitId}
        onBack={() => setIsWorkspaceOpen(false)}
        onCompleted={() => setIsWorkspaceOpen(false)}
      />
    );
  }

  const columns = [
    {
      title: 'Visit Date',
      dataIndex: 'originalVisitDate',
      key: 'date',
      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Current Diagnosis',
      key: 'diagnosis',
      render: (_: any, r: IVisit) => {
        const latest = r.versions?.[r.versions.length - 1];
        return <span style={{ fontWeight: 500, color: '#0F172A' }}>{latest?.diagnosis || 'N/A'}</span>;
      },
    },
    {
      title: 'Revision',
      key: 'version',
      render: (_: any, r: IVisit) => (
        <Tag color={r.currentVersion > 1 ? 'purple' : 'blue'}>
          v{r.currentVersion} ({r.status})
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, r: IVisit) => (
        <Space size={8}>
          <Button
            size="small"
            type="primary"
            ghost
            icon={<ExternalLink size={13} />}
            onClick={() => {
              setActiveVisitId(r.id);
              setIsWorkspaceOpen(true);
            }}
          >
            Open Workspace
          </Button>
          <Button
            size="small"
            icon={<History size={14} />}
            onClick={() => {
              setSelectedVisit(r);
              setIsHistoryOpen(true);
            }}
          >
            Audit History
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#0F172A' }}>
            {t('records')}
          </Title>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
            Immutable append-only clinical consultation versions and regulatory audit trails
          </div>
        </div>
        <Button
          type="primary"
          icon={<FilePlus size={16} />}
          onClick={() => {
            setActiveVisitId(undefined);
            setIsWorkspaceOpen(true);
          }}
          style={{ height: 38, fontWeight: 500 }}
        >
          New Clinical Consultation
        </Button>
      </div>

      <Table
        dataSource={visits}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0' }}
      />

      {/* Audit Version History Modal */}
      <Modal
        title="Clinical Record Version & Audit Trail"
        open={isHistoryOpen}
        onCancel={() => setIsHistoryOpen(false)}
        footer={null}
        width={680}
      >
        {selectedVisit && (
          <div>
            <Text type="secondary">
              Record ID: <code>{selectedVisit.id}</code> | Created: {dayjs(selectedVisit.originalVisitDate).format('YYYY-MM-DD HH:mm')}
            </Text>
            <Timeline
              style={{ marginTop: 24 }}
              items={(selectedVisit.versions || []).map((v) => ({
                color: v.versionNumber === selectedVisit.currentVersion ? 'green' : 'gray',
                children: (
                  <Card size="small" style={{ marginBottom: 12, borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Tag color="blue">Revision #{v.versionNumber}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(v.changedAt).format('YYYY-MM-DD HH:mm')} by {v.changedBy}
                      </Text>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Text strong>Reason for Revision: </Text>
                      <Text italic>{v.changeReason}</Text>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Text strong>Diagnosis: </Text>
                      <Text>{v.diagnosis}</Text>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Text strong>Notes: </Text>
                      <Text>{v.clinicalNotes}</Text>
                    </div>
                  </Card>
                ),
              }))}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
