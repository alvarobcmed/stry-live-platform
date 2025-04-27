import React, { useState, useEffect } from 'react';
import { FaCode, FaCheck, FaTimes, FaExclamationTriangle, FaPlay, FaStop, FaBug, FaClipboard } from 'react-icons/fa';
import './TestSuite.css';

const TestSuite = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [runningTest, setRunningTest] = useState(null);
  const [testProgress, setTestProgress] = useState(0);
  const [testLogs, setTestLogs] = useState([]);
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [testSummary, setTestSummary] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  });

  const testModules = [
    { id: 'authentication', name: 'Autenticação', component: 'TestAuthentication' },
    { id: 'stories', name: 'Stories', component: 'TestStories' },
    { id: 'lives', name: 'Lives', component: 'TestLiveStreaming' },
    { id: 'integration', name: 'Integração', component: 'TestIntegration' },
    { id: 'payment', name: 'Pagamento', component: 'TestPayment' },
    { id: 'admin', name: 'Sistema Admin', component: 'TestAdminSystem' },
    { id: 'notifications', name: 'Notificações', component: 'TestNotifications' },
    { id: 'siteCreator', name: 'Criador de Sites', component: 'TestSiteCreator' }
  ];

  useEffect(() => {
    // Carregar resultados de testes anteriores, se existirem
    fetchTestResults();
  }, []);

  const fetchTestResults = async () => {
    try {
      const response = await fetch('/api/tests/results', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResults(data.results || {});
        updateTestSummary(data.results || {});
      }
    } catch (error) {
      console.error('Erro ao buscar resultados de testes:', error);
    }
  };

  const updateTestSummary = (results) => {
    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    
    Object.values(results).forEach(moduleResult => {
      if (!moduleResult || !moduleResult.tests) return;
      
      moduleResult.tests.forEach(test => {
        total++;
        if (test.status === 'passed') passed++;
        else if (test.status === 'failed') failed++;
        else if (test.status === 'skipped') skipped++;
      });
    });
    
    setTestSummary({ total, passed, failed, skipped });
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestLogs([]);
    setTestProgress(0);
    
    try {
      for (let i = 0; i < testModules.length; i++) {
        const module = testModules[i];
        setRunningTest(module.id);
        
        // Simular progresso
        const progressIncrement = 100 / testModules.length;
        setTestProgress(i * progressIncrement);
        
        await runTestModule(module.id);
        
        // Atualizar progresso
        setTestProgress((i + 1) * progressIncrement);
      }
      
      setRunningTest(null);
      setTestProgress(100);
    } catch (error) {
      console.error('Erro ao executar testes:', error);
      addTestLog({
        type: 'error',
        message: `Erro ao executar testes: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const runTestModule = async (moduleId) => {
    addTestLog({
      type: 'info',
      message: `Iniciando testes do módulo: ${getModuleName(moduleId)}`,
      timestamp: new Date().toISOString()
    });
    
    try {
      const response = await fetch(`/api/tests/run/${moduleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Atualizar resultados
        setTestResults(prevResults => ({
          ...prevResults,
          [moduleId]: data
        }));
        
        // Adicionar logs
        data.logs.forEach(log => {
          addTestLog(log);
        });
        
        // Atualizar resumo
        updateTestSummary({
          ...testResults,
          [moduleId]: data
        });
        
        addTestLog({
          type: data.status === 'passed' ? 'success' : 'error',
          message: `Testes do módulo ${getModuleName(moduleId)} concluídos: ${data.passed}/${data.total} passaram`,
          timestamp: new Date().toISOString()
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao executar testes');
      }
    } catch (error) {
      console.error(`Erro ao executar testes do módulo ${moduleId}:`, error);
      addTestLog({
        type: 'error',
        message: `Erro ao executar testes do módulo ${getModuleName(moduleId)}: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const addTestLog = (log) => {
    setTestLogs(prevLogs => [...prevLogs, log]);
  };

  const getModuleName = (moduleId) => {
    const module = testModules.find(m => m.id === moduleId);
    return module ? module.name : moduleId;
  };

  const getModuleStatus = (moduleId) => {
    const moduleResult = testResults[moduleId];
    if (!moduleResult) return 'not-run';
    return moduleResult.status;
  };

  const getModuleIcon = (status) => {
    switch (status) {
      case 'passed':
        return <FaCheck className="status-icon passed" />;
      case 'failed':
        return <FaTimes className="status-icon failed" />;
      case 'running':
        return <div className="spinner small"></div>;
      case 'partial':
        return <FaExclamationTriangle className="status-icon partial" />;
      default:
        return <FaCode className="status-icon not-run" />;
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success':
        return <FaCheck className="log-icon success" />;
      case 'error':
        return <FaTimes className="log-icon error" />;
      case 'warning':
        return <FaExclamationTriangle className="log-icon warning" />;
      default:
        return <FaCode className="log-icon info" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleLogClick = (log) => {
    setSelectedLog(log);
    setShowLogDetails(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const renderOverview = () => {
    return (
      <div className="test-overview">
        <div className="test-summary">
          <div className="summary-card total">
            <h3>Total de Testes</h3>
            <p className="summary-value">{testSummary.total}</p>
          </div>
          
          <div className="summary-card passed">
            <h3>Passaram</h3>
            <p className="summary-value">{testSummary.passed}</p>
          </div>
          
          <div className="summary-card failed">
            <h3>Falharam</h3>
            <p className="summary-value">{testSummary.failed}</p>
          </div>
          
          <div className="summary-card skipped">
            <h3>Ignorados</h3>
            <p className="summary-value">{testSummary.skipped}</p>
          </div>
        </div>
        
        <div className="test-modules">
          <h3>Módulos de Teste</h3>
          <div className="modules-grid">
            {testModules.map(module => {
              const status = runningTest === module.id ? 'running' : getModuleStatus(module.id);
              
              return (
                <div 
                  key={module.id} 
                  className={`module-card ${status}`}
                  onClick={() => setActiveTab(module.id)}
                >
                  <div className="module-header">
                    <h4>{module.name}</h4>
                    {getModuleIcon(status)}
                  </div>
                  
                  <div className="module-stats">
                    {testResults[module.id] ? (
                      <>
                        <span className="stat-item">
                          {testResults[module.id].passed}/{testResults[module.id].total} testes
                        </span>
                        <span className="stat-item">
                          {testResults[module.id].duration}ms
                        </span>
                      </>
                    ) : (
                      <span className="stat-item">Não executado</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="test-actions">
          <button 
            className="run-all-button"
            onClick={runAllTests}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner small"></div> Executando...
              </>
            ) : (
              <>
                <FaPlay /> Executar Todos os Testes
              </>
            )}
          </button>
        </div>
        
        {loading && (
          <div className="test-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${testProgress}%` }}
              ></div>
            </div>
            <p className="progress-text">
              Executando {getModuleName(runningTest)} ({Math.round(testProgress)}%)
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderModuleTests = (moduleId) => {
    const moduleResult = testResults[moduleId];
    
    if (!moduleResult) {
      return (
        <div className="module-not-run">
          <p>Este módulo ainda não foi executado.</p>
          <button 
            className="run-module-button"
            onClick={() => runTestModule(moduleId)}
            disabled={loading}
          >
            {loading && runningTest === moduleId ? (
              <>
                <div className="spinner small"></div> Executando...
              </>
            ) : (
              <>
                <FaPlay /> Executar Módulo
              </>
            )}
          </button>
        </div>
      );
    }
    
    return (
      <div className="module-tests">
        <div className="module-header">
          <h3>{getModuleName(moduleId)}</h3>
          <div className="module-actions">
            <button 
              className="run-module-button"
              onClick={() => runTestModule(moduleId)}
              disabled={loading}
            >
              {loading && runningTest === moduleId ? (
                <>
                  <div className="spinner small"></div> Executando...
                </>
              ) : (
                <>
                  <FaPlay /> Executar Novamente
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="module-summary">
          <div className="summary-item">
            <span className="summary-label">Total:</span>
            <span className="summary-value">{moduleResult.total}</span>
          </div>
          
          <div className="summary-item passed">
            <span className="summary-label">Passaram:</span>
            <span className="summary-value">{moduleResult.passed}</span>
          </div>
          
          <div className="summary-item failed">
            <span className="summary-label">Falharam:</span>
            <span className="summary-value">{moduleResult.failed}</span>
          </div>
          
          <div className="summary-item">
            <span className="summary-label">Duração:</span>
            <span className="summary-value">{moduleResult.duration}ms</span>
          </div>
        </div>
        
        <div className="tests-list">
          <table className="tests-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Nome do Teste</th>
                <th>Duração</th>
                <th>Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {moduleResult.tests.map((test, index) => (
                <tr key={index} className={`test-row ${test.status}`}>
                  <td className="test-status">
                    {test.status === 'passed' ? (
                      <FaCheck className="status-icon passed" />
                    ) : test.status === 'failed' ? (
                      <FaTimes className="status-icon failed" />
                    ) : (
                      <FaExclamationTriangle className="status-icon skipped" />
                    )}
                  </td>
                  <td className="test-name">{test.name}</td>
                  <td className="test-duration">{test.duration}ms</td>
                  <td className="test-message">
                    {test.message || (test.status === 'passed' ? 'Teste passou com sucesso' : 'Teste ignorado')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderLogs = () => {
    return (
      <div className="test-logs">
        <h3>Logs de Execução</h3>
        
        {testLogs.length === 0 ? (
          <p className="no-logs">Nenhum log disponível. Execute os testes para gerar logs.</p>
        ) : (
          <div className="logs-list">
            {testLogs.map((log, index) => (
              <div 
                key={index} 
                className={`log-item ${log.type}`}
                onClick={() => handleLogClick(log)}
              >
                <div className="log-icon-container">
                  {getLogIcon(log.type)}
                </div>
                
                <div className="log-content">
                  <div className="log-message">{log.message}</div>
                  <div className="log-timestamp">{formatTimestamp(log.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showLogDetails && selectedLog && (
          <div className="log-details-modal">
            <div className="log-details-content">
              <div className="log-details-header">
                <h4>Detalhes do Log</h4>
                <button 
                  className="close-button"
                  onClick={() => setShowLogDetails(false)}
                >
                  &times;
                </button>
              </div>
              
              <div className="log-details-body">
                <div className="log-detail-item">
                  <span className="detail-label">Tipo:</span>
                  <span className={`detail-value ${selectedLog.type}`}>
                    {selectedLog.type}
                  </span>
                </div>
                
                <div className="log-detail-item">
                  <span className="detail-label">Timestamp:</span>
                  <span className="detail-value">
                    {new Date(selectedLog.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>
                
                <div className="log-detail-item">
                  <span className="detail-label">Mensagem:</span>
                  <div className="detail-value message">
                    {selectedLog.message}
                    <button 
                      className="copy-button"
                      onClick={() => copyToClipboard(selectedLog.message)}
                      title="Copiar mensagem"
                    >
                      <FaClipboard />
                    </button>
                  </div>
                </div>
                
                {selectedLog.details && (
                  <div className="log-detail-item">
                    <span className="detail-label">Detalhes:</span>
                    <pre className="detail-value details">
                      {JSON.stringify(selectedLog.details, null, 2)}
                      <button 
                        className="copy-button"
                        onClick={() => copyToClipboard(JSON.stringify(selectedLog.details, null, 2))}
                        title="Copiar detalhes"
                      >
                        <FaClipboard />
                      </button>
                    </pre>
                  </div>
                )}
                
                {selectedLog.stack && (
                  <div className="log-detail-item">
                    <span className="detail-label">Stack Trace:</span>
                    <pre className="detail-value stack">
                      {selectedLog.stack}
                      <button 
                        className="copy-button"
                        onClick={() => copyToClipboard(selectedLog.stack)}
                        title="Copiar stack trace"
                      >
                        <FaClipboard />
                      </button>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBugReport = () => {
    return (
      <div className="bug-report">
        <h3>Relatório de Bugs</h3>
        
        <div className="bug-report-form">
          <div className="form-group">
            <label htmlFor="bugTitle">Título do Bug</label>
            <input 
              type="text" 
              id="bugTitle" 
              placeholder="Descreva o bug em poucas palavras"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="bugDescription">Descrição Detalhada</label>
            <textarea 
              id="bugDescription" 
              rows={5}
              placeholder="Descreva o bug em detalhes, incluindo passos para reproduzir"
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="bugModule">Módulo</label>
            <select id="bugModule">
              <option value="">Selecione um módulo</option>
              {testModules.map(module => (
                <option key={module.id} value={module.id}>
                  {module.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="bugSeverity">Severidade</label>
            <select id="bugSeverity">
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="bugScreenshot">Screenshot (opcional)</label>
            <input type="file" id="bugScreenshot" />
          </div>
          
          <div className="form-actions">
            <button className="submit-bug-button">
              <FaBug /> Reportar Bug
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="test-suite-container">
      <div className="test-suite-header">
        <h1>
          <FaCode /> Suite de Testes
        </h1>
      </div>
      
      <div className="test-suite-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Visão Geral
        </button>
        
        {testModules.map(module => (
          <button 
            key={module.id}
            className={`tab-button ${activeTab === module.id ? 'active' : ''}`}
            onClick={() => setActiveTab(module.id)}
          >
            {module.name}
          </button>
        ))}
        
        <button 
          className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Logs
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'bug-report' ? 'active' : ''}`}
          onClick={() => setActiveTab('bug-report')}
        >
          Reportar Bug
        </button>
      </div>
      
      <div className="test-suite-content">
        {activeTab === 'overview' && renderOverview()}
        {testModules.map(module => (
          activeTab === module.id && renderModuleTests(module.id)
        ))}
        {activeTab === 'logs' && renderLogs()}
        {activeTab === 'bug-report' && renderBugReport()}
      </div>
    </div>
  );
};

export default TestSuite;
