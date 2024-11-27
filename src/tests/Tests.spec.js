import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Métricas customizadas
export const getCharactersDuration = new Trend('get_characters', true);
export const RateContentOK = new Rate('content_OK');

// Configurações do teste
export const options = {
  thresholds: {
    http_req_failed: ['rate<0.12'], // No máximo 12% de falhas
    get_characters: ['p(95)<5700'], // 95% das requisições em menos de 5700ms
    content_OK: ['rate>0.95'] // Taxa de respostas válidas acima de 95%
  },
  stages: [
    { duration: '1m', target: 10 }, 
    { duration: '1m', target: 60 }, 
    { duration: '1m', target: 100 },
    { duration: '1m', target: 200 },
    { duration: '1m', target: 300 } 
  ]
};

// Relatórios gerados no final do teste
export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data), // Relatório HTML
    stdout: textSummary(data, { indent: ' ', enableColors: true }) // Resumo no terminal
  };
}

// Função principal do teste
export default function () {
  const baseUrl = 'https://api.disneyapi.dev/character';

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const OK = 200;

  // Faz a requisição GET ao endpoint
  const res = http.get(baseUrl, params);

  // Adiciona o tempo de duração da requisição à métrica personalizada
  getCharactersDuration.add(res.timings.duration);

  // Verifica se a resposta tem status 200 e adiciona à métrica de taxa
  RateContentOK.add(res.status === OK);

  // Valida a resposta
  check(res, {
    'GET Characters - Status 200': () => res.status === OK,
    'GET Characters - Corpo não está vazio': () => res.body.length > 0
  });
}
