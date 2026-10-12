import { expect, test } from '@playwright/test';

test('rector observes, approves and confirms FIN while preserving paged review evidence on mobile',async({page})=>{
  await page.setViewportSize({width:320,height:900});await page.addInitScript(()=>sessionStorage.setItem('sgp_session_user',JSON.stringify({id:'1',nombre:'Rector',correo:'rector@test',rol:'manager',iniciales:'RE'})));
  const at='2026-10-01T12:00:00Z';const cut={id:1,schoolId:1,schoolName:'Escuela',cycleName:'Ciclo',cutCode:'CORTE-1',cutDate:'2026-10-01',status:'CONSOLIDATED',version:2,asOf:at,canManage:false,canReadFinalReports:true};
  const format={id:3,version:1,templateName:'Formato de prueba',requiredSections:['TITLE'],recipients:['Rectoría'],decisionRef:'https://example.org/decision',reason:'Decisión',recordedBy:'Admin',recordedAt:at,effectiveAt:at};
  const report:any={id:7,cutId:1,version:2,title:'Informe',status:'PUBLISHED',achievementsSummary:'Logros',difficultiesSummary:'Dificultades',conclusions:'Conclusiones',generatedAt:at,publishedAt:at,transitionVersion:1,canReview:true,canFinish:false,canPublish:false,formatPolicyApproved:true,publicationFormat:format,currentFormat:format};
  const reviews=Array.from({length:101},(_,index)=>({id:index+1,reportId:7,reportVersion:2,reviewVersion:index+1,decision:'OBSERVED',comment:index===0?'Comentario rectoral original':'Antecedente',evidenceUrls:[index===0?'https://example.org/original':'https://example.org/recent'],actorId:1,actorName:'Rector',reviewedAt:at}));
  const writes:{path:string;version:string;body:any}[]=[];
  await page.route('**/api/**',async route=>{
    const request=route.request();const url=new URL(request.url());const path=url.pathname;let data:unknown=[];
    if(path==='/api/v2/monitoring-cuts')data=[cut];
    if(path.endsWith('/final-reports/search'))data={items:[report],totalElements:1,totalPages:1,currentPage:0,pageSize:20,latestVersion:2};
    if(path==='/api/v2/school-final-reports/7')data=report;
    if(path.endsWith('/reviews/search')){const current=Number(url.searchParams.get('page')??0);data={items:[...reviews].reverse().slice(current*20,current*20+20),totalElements:reviews.length,totalPages:Math.ceil(reviews.length/20),currentPage:current,pageSize:20};}
    if(request.method()==='POST'){
      const body=request.postDataJSON();writes.push({path,version:request.headers()['if-match'],body});report.transitionVersion++;
      if(path.endsWith('/reviews')){const saved={id:reviews.length+1,reportId:7,reportVersion:body.reportVersion,reviewVersion:reviews.length+1,decision:body.decision,comment:body.comment,evidenceUrls:body.evidenceUrls,actorId:1,actorName:'Rector',reviewedAt:at};reviews.push(saved);report.status=body.decision;report.latestReview=saved;report.canFinish=body.decision==='APPROVED';data={review:saved,report};}
      else if(path.endsWith('/finish')){cut.status='FIN';cut.version++;report.cutStatus='FIN';report.finishedAt=at;report.finalReviewId=body.reviewId;report.canReview=false;report.canFinish=false;data=report;}
    }
    await route.fulfill({contentType:'application/json',body:JSON.stringify({state:'READY',data})});
  });
  await page.goto('/monitoreo');await page.getByLabel('Corte de monitoreo').selectOption('1');await page.getByRole('button',{name:'Consultar borradores finales'}).click();await page.getByRole('button',{name:'Consultar versión 2'}).click();
  const panel=page.getByRole('region',{name:'Revisión rectoral y FIN'});await panel.getByLabel('Decisión de Rectoría').selectOption('OBSERVED');await panel.getByLabel('Comentario de revisión rectoral').fill('Nueva observación');await panel.getByLabel('Soportes de revisión rectoral').fill('https://example.org/new');
  for(let i=0;i<5;i++)await panel.getByRole('button',{name:'Página siguiente de revisiones'}).click();await expect(panel.getByText('Comentario rectoral original',{exact:true})).toBeVisible();await expect(panel.getByRole('link',{name:'Consultar soporte rectoral 1'})).toHaveAttribute('href','https://example.org/original');await expect(panel.getByLabel('Comentario de revisión rectoral')).toHaveValue('Nueva observación');
  await panel.getByRole('button',{name:'Registrar revisión de esta versión'}).click();await expect(page.getByText('Estado: OBSERVED',{exact:true})).toBeVisible();await expect(panel.getByRole('button',{name:'Registrar FIN del corte'})).toHaveCount(0);
  await panel.getByLabel('Decisión de Rectoría').selectOption('APPROVED');await panel.getByLabel('Comentario de revisión rectoral').fill('Soportes completos');await panel.getByLabel('Soportes de revisión rectoral').fill('https://example.org/approved');await panel.getByRole('button',{name:'Registrar revisión de esta versión'}).click();await expect(page.getByText('Estado: APPROVED',{exact:true})).toBeVisible();await expect(panel.getByRole('button',{name:'Registrar FIN del corte'})).toBeDisabled();
  await panel.getByLabel(/Confirmo FIN/).check();await panel.getByRole('button',{name:'Registrar FIN del corte'}).click();await expect(panel.getByText(/Corte en FIN desde/)).toBeVisible();await expect(panel.getByLabel('Decisión de Rectoría')).toHaveCount(0);
  expect(writes.map(write=>[write.path,write.version])).toEqual([['/api/v2/school-final-reports/7/reviews','1'],['/api/v2/school-final-reports/7/reviews','2'],['/api/v2/school-final-reports/7/finish','3']]);expect(writes[2].body).toMatchObject({reportVersion:2,reviewId:103,confirmed:true});
  await page.reload();await page.getByLabel('Corte de monitoreo').selectOption('1');await page.getByRole('button',{name:'Consultar borradores finales'}).click();await page.getByRole('button',{name:'Consultar versión 2'}).click();await expect(page.getByText(/Corte en FIN desde/)).toBeVisible();expect(await page.getByRole('main').evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
});

test('publishes the selected report with its confirmed format at mobile width',async({page})=>{
  await page.setViewportSize({width:320,height:900});await page.addInitScript(()=>sessionStorage.setItem('sgp_session_user',JSON.stringify({id:'1',nombre:'Director',correo:'director@test',rol:'manager',iniciales:'DI'})));
  const format={id:3,version:4,templateName:'Formato aprobado de prueba',requiredSections:['TITLE','CUT'],recipients:['Rectoría'],decisionRef:'https://example.org/decision',reason:'Decisión',recordedBy:'Admin',recordedAt:'2026-10-01T12:00:00Z',effectiveAt:'2026-10-01T12:00:00Z'};
  const report={id:7,cutId:1,version:2,title:'Informe',status:'DRAFT',achievementsSummary:'Logros',difficultiesSummary:'Dificultades',conclusions:'Conclusiones',generatedAt:'2026-10-01T12:00:00Z',transitionVersion:0,canPublish:true,formatPolicyApproved:true,currentFormat:format,publicationFormat:null as typeof format|null,publishedAt:null as string|null};
  const writes:{path:string;version:string;body:any}[]=[];
  await page.route('**/api/**',async route=>{
    const request=route.request();const path=new URL(request.url()).pathname;let data:unknown=[];
    if(path==='/api/v2/monitoring-cuts')data=[{id:1,schoolId:1,schoolName:'Escuela',cycleName:'Ciclo',cutCode:'CORTE-1',cutDate:'2026-10-01',status:'CONSOLIDATED',version:2,asOf:'2026-10-01T12:00:00Z',canManage:true}];
    if(path.endsWith('/final-reports/search'))data={items:[report],totalElements:1,totalPages:1,currentPage:0,pageSize:20,latestVersion:2};
    if(path==='/api/v2/school-final-reports/7')data=report;
    if(path.endsWith('/reviews/search'))data={items:[],totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(request.method()==='POST'){
      writes.push({path,version:request.headers()['if-match'],body:request.postDataJSON()});report.status='PUBLISHED';report.transitionVersion=1;report.canPublish=false;report.publicationFormat=format;report.publishedAt='2026-10-04T12:00:00Z';data=report;
    }
    await route.fulfill({contentType:'application/json',body:JSON.stringify({state:'READY',data})});
  });
  await page.goto('/monitoreo');await page.getByLabel('Corte de monitoreo').selectOption('1');await page.getByRole('button',{name:'Consultar borradores finales'}).click();await page.getByRole('button',{name:'Consultar versión 2'}).click();
  await expect(page.getByRole('button',{name:'Publicar versión del informe'})).toBeDisabled();await page.getByLabel(/Confirmo la publicación/).check();await page.getByRole('button',{name:'Publicar versión del informe'}).click();await expect(page.getByText('Estado: PUBLISHED',{exact:true})).toBeVisible();
  await expect(page.getByText(/Formato conservado al publicar/)).toBeVisible();expect(writes).toEqual([{path:'/api/v2/school-final-reports/7/publish',version:'0',body:{formatVersion:4,confirmed:true,idempotencyKey:expect.any(String)}}]);
  expect(await page.getByRole('main').evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
});

test('report format requires an explicit decision and preserves input after conflict at mobile width', async ({ page }) => {
  await page.setViewportSize({width:320,height:900});
  await page.addInitScript(()=>sessionStorage.setItem('sgp_session_user',JSON.stringify({id:'1',nombre:'Admin',correo:'admin@test',rol:'admin',iniciales:'AD'})));
  const writes: {path:string; version:string; body:unknown}[]=[];
  await page.route('**/api/**',async route=>{
    const request=route.request();const path=new URL(request.url()).pathname;
    if(request.method()!=='GET'){
      writes.push({path,version:request.headers()['if-match'],body:request.postDataJSON()});
      await route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'VERSION_CONFLICT',traceId:'fixture-conflict'})});return;
    }
    const data=path==='/api/v2/report-format-policy/search'?{items:[],totalElements:0,totalPages:0,currentPage:0,pageSize:20,latestVersion:0}:[];
    await route.fulfill({contentType:'application/json',body:JSON.stringify({state:'READY',data})});
  });
  await page.goto('/politicas');await page.getByRole('button',{name:'Consultar formato de informe'}).click();
  const panel=page.getByRole('region',{name:'Formato de informe final'});
  await expect(panel.getByText(/No hay formatos/)).toBeVisible();
  await expect(panel.getByRole('button',{name:'Registrar formato aprobado'})).toBeDisabled();
  await expect(panel.getByLabel('Título',{exact:true})).not.toBeChecked();
  await panel.getByLabel('Nombre de plantilla aprobada').fill('Plantilla de prueba');await panel.getByLabel('Título',{exact:true}).check();
  await panel.getByLabel('Destinatarios del informe').fill('Rectoría\nDirección');await panel.getByLabel('Referencia de aprobación del formato').fill('https://example.org/decision');
  await panel.getByLabel('Motivo del formato').fill('Decisión de prueba');await panel.getByLabel(/Confirmo que plantilla/).check();
  await panel.getByRole('button',{name:'Registrar formato aprobado'}).click();await expect(panel.getByRole('alert')).toBeVisible();
  await expect(panel.getByLabel('Nombre de plantilla aprobada')).toHaveValue('Plantilla de prueba');
  expect(writes).toEqual([{path:'/api/v2/report-format-policy',version:'0',body:{templateName:'Plantilla de prueba',requiredSections:['TITLE'],recipients:['Rectoría','Dirección'],decisionRef:'https://example.org/decision',reason:'Decisión de prueba',confirmed:true}}]);
  await panel.getByLabel('Nombre de plantilla aprobada').focus();await expect(panel.getByLabel('Nombre de plantilla aprobada')).toBeFocused();
  expect(await page.getByRole('main').evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
});

// Isolated browser fixtures. These never replace API data in the application.
test('operational screens reflow at 320, 768 and 1024px and expose keyboard controls', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('sgp_session_user', JSON.stringify({ id: '1', nombre: 'Gestor de prueba', correo: 'gestor@test', rol: 'manager', iniciales: 'GP' }));
  });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const cycle = { id: 1, name: 'Ciclo anual', startDate: '2026-01-01', endDate: '2026-12-31', cadenceDays: 30, status: 'ACTIVE', version: 0, periodIds: [1] };
    const metric = { id: 1, name: 'Retención', unitOfMeasureId: 1, direction: 'MAINTAIN', sourceDescription: 'Registro académico', frequencyDays: 30, active: true, version: 0 };
    const kr = { id: 1, name: 'Retener estudiantes', description: 'Tasa anual', metricDefinitionId: 1, metricDefinitionName: 'Retención', baseValue: 40, targetValue: 70, strategicCycleId: 1, strategicCycleName: 'Ciclo anual', responsibleId: 2, responsibleName: 'Profesora de prueba', status: 'DRAFT', type: 'COMMITTED', version: 0, active: true, linkedGoalIds: [], linkedBetIds: [], unitName: '%', unitType: 'PORCENTAJE', measuredValue: null, progressPercent: null, progressStatus: null };
    const data: Record<string, unknown> = {
      '/api/v2/cycles': [cycle], '/api/v2/metric-definitions': [metric],
      '/api/v2/key-results': [kr],
      '/api/v2/key-results/1/tracking': kr,
      '/api/v2/key-results/1/measurements/search': {items:[],totalElements:0,totalPages:0,currentPage:0,pageSize:20},
      '/api/v2/key-results/1/progress/search': {items:[],totalElements:0,totalPages:0,currentPage:0,pageSize:20},
      '/api/v2/key-results/search': { items: [kr], totalElements: 1, totalPages: 1, currentPage: 0, pageSize: 20 },
      '/api/v2/initiatives': [], '/api/v2/initiative-responsibles': [{ id: 2, name: 'Profesora de prueba', departmentId: 10, departmentName: 'Departamento' }],
      '/api/v2/initiatives/search': {items:[],totalElements:0,totalPages:0,currentPage:0,pageSize:20},
      '/api/v2/strategy-choices': { goals: [], bets: [] },
    };
    let body: unknown = [];
    if (path === '/api/v1/academic-periods') body = [{ id: 1, name: '2026', startDate: '2026-01-01', endDate: '2026-12-31', status: 'ACTIVO' }];
    else if (path === '/api/v1/measurement-units') body = [{ id: 1, name: 'Porcentaje', type: 'PORCENTAJE', active: true }];
    else if (path.startsWith('/api/v2/')) body = { state: 'READY', data: data[path] ?? [] };
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
  });
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [path, title, control] of [
      ['/ciclos', 'Ciclos estratégicos', 'Nombre'],
      ['/metricas', 'Fichas métricas', 'Nombre'],
      ['/seguimiento?kr=1', 'Seguimiento de KRs', 'Resultado clave'],
      ['/iniciativas', 'Iniciativas', 'KR asociado'],
      ['/resultados', 'Definir resultados clave', 'Buscar por nombre'],
    ]) {
      await page.goto(path);
      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { name: title, exact: true })).toBeVisible();
      await expect(main.getByLabel(control, { exact: true })).toBeVisible();
      await main.getByLabel(control, { exact: true }).focus();
      await expect(main.getByLabel(control, { exact: true })).toBeFocused();
      await page.keyboard.press('Tab');
      expect(await main.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    }
  }
  await page.screenshot({ path: 'test-results/resultados-1024.png', fullPage: true });
});

test('initiative evidence and execution forms submit independently at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem('sgp_session_user', JSON.stringify({ id: '1', nombre: 'Gestor', correo: 'gestor@test', rol: 'manager', iniciales: 'GP' })));
  const writes: string[] = []; const evidence: unknown[] = []; const execution: unknown[] = [];
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    const initiative={id:7,keyResultId:1,keyResultName:'KR',departmentId:10,title:'Taller',description:'Acompañamiento',active:true,status:'ACTIVE',version:0,progressPercent:0};
    if (path === '/api/v2/initiatives') data = [initiative];
    if (path === '/api/v2/initiatives/7') data = initiative;
    if (path === '/api/v2/initiatives/search') data = {items:[initiative],totalElements:1,totalPages:1,currentPage:0,pageSize:20};
    if (path === '/api/v2/initiatives/7/progress/search' || path === '/api/v2/initiatives/7/assignments/search') data = {items:[],totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if (path === '/api/v2/initiatives/7/evidence') {
      if (route.request().method() === 'POST') { writes.push(path); evidence.push({ ...route.request().postDataJSON(), id: 1, active: true, createdBy: 'Gestor', createdAt: '2026-01-01T12:00:00Z' }); }
      data = evidence;
    }
    if (path === '/api/v2/initiatives/7/evidence/search') data = { items: evidence, totalElements: evidence.length, totalPages: evidence.length ? 1 : 0, currentPage: 0, pageSize: 20 };
    if (path === '/api/v2/initiatives/7/execution') {
      if (route.request().method() === 'POST') { writes.push(path); execution.push({ ...route.request().postDataJSON(), id: 1, actorName: 'Gestor', createdAt: '2026-01-01T12:00:00Z' }); }
      data = execution;
    }
    if (path === '/api/v2/initiatives/7/execution/search') data = { items: execution, totalElements: execution.length, totalPages: execution.length ? 1 : 0, currentPage: 0, pageSize: 20 };
    if (path === '/api/v2/initiatives/7/planner-references') data = { items: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 20, source: 'REGISTERED_REFERENCES' };
    if (path === '/api/v2/key-results/search') data = {items:[],totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/history/search')&&Array.isArray(data))data={items:data,totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/entries/search')&&Array.isArray(data))data={items:data,totalElements:data.length,totalPages:data.length?1:0,currentPage:0,pageSize:20};
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ state: 'READY', data }) });
  });
  await page.goto('/iniciativas'); await page.getByRole('button', { name: 'Ver seguimiento' }).click();
  await page.getByLabel('Título de evidencia').fill('Acta del taller'); await page.getByLabel('Enlace de evidencia').fill('https://example.org/acta');
  await page.getByRole('button', { name: 'Registrar evidencia' }).click();
  await expect(page.getByRole('link', { name: 'Abrir referencia externa' })).toHaveAttribute('href', 'https://example.org/acta');
  await page.getByLabel('Fecha de ejecución').fill('2026-01-02'); await page.getByLabel('Trabajo realizado').fill('Taller realizado');
  await page.getByRole('button', { name: 'Registrar ejecución' }).click();
  await expect(page.getByText('Taller realizado', { exact: true })).toBeVisible();
  expect(writes).toEqual(['/api/v2/initiatives/7/evidence', '/api/v2/initiatives/7/execution']);
  expect(await page.getByRole('main').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
});

test('KR relations and owner changes keep a visible history at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem('sgp_session_user', JSON.stringify({ id: '1', nombre: 'Gestor', correo: 'gestor@test', rol: 'manager', iniciales: 'GP' })));
  const kr = { id: 8, name: 'Retención', description: 'Tasa anual', baseValue: 40, targetValue: 70, status: 'DRAFT', type: 'COMMITTED', version: 4, active: true, departmentId: 10, responsibleId: 1, responsibleName: 'Anterior', linkedGoalIds: [] as number[], linkedBetIds: [] as number[] };
  const goals: unknown[] = []; const assignments = [{ id: 1, professorId: 1, name: 'Anterior', startedAt: '2026-01-01T12:00:00Z', endedAt: null as string | null, actorName: 'Gestor' }];
  const writes: { path: string; version: string | undefined }[] = [];
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname; const method = route.request().method(); let data: unknown = [];
    if (method !== 'GET') {
      writes.push({ path, version: route.request().headers()['if-match'] }); kr.version++;
      if (path.endsWith('/goals')) { goals.push({ id: 1, targetId: 3, name: 'Permanencia', startedAt: '2026-01-02T12:00:00Z', endedAt: null, actorName: 'Gestor' }); kr.linkedGoalIds = [3]; }
      if (path.endsWith('/assignee')) { assignments[0].endedAt = '2026-01-03T12:00:00Z'; assignments.push({ id: 2, professorId: 2, name: 'Nueva', startedAt: '2026-01-03T12:00:00Z', endedAt: null, actorName: 'Gestor' }); kr.responsibleId = 2; kr.responsibleName = 'Nueva'; }
      data = kr;
    } else if (path.endsWith('/search')) data = { items: [kr], totalElements: 1, totalPages: 1, currentPage: 0, pageSize: 20 };
    else if (path.endsWith('/relations')) data = { goals, bets: [], assignments };
    else if (path.endsWith('/activation-check')) data = { ready: false, checks: [{ code: 'POLICY', passed: false, actual: 0, required: 1 }] };
    else if (path === '/api/v2/key-results/8') data = kr;
    else if (path.endsWith('/strategy-choices')) data = { goals: [{ id: 3, name: 'Permanencia' }], bets: [] };
    else if (path.endsWith('/initiative-responsibles')) data = [{ id: 1, name: 'Anterior', departmentId: 10 }, { id: 2, name: 'Nueva', departmentId: 10 }];
    if(path.endsWith('/history/search')&&Array.isArray(data))data={items:data,totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/entries/search')&&Array.isArray(data))data={items:data,totalElements:data.length,totalPages:data.length?1:0,currentPage:0,pageSize:20};
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ state: 'READY', data }) });
  });
  await page.goto('/resultados'); await page.getByLabel('KR para vínculos y responsables').selectOption('8');
  await page.getByLabel('Nuevo vínculo').selectOption('3'); await page.getByLabel('Motivo del cambio').fill('Alineación'); await page.getByRole('button', { name: 'Agregar vínculo' }).click();
  await expect(page.getByRole('button', { name: 'Finalizar vínculo con Permanencia' })).toBeVisible();
  await page.getByLabel('Nuevo responsable', { exact: true }).selectOption('2'); await page.getByLabel('Motivo del cambio').fill('Reasignación'); await page.getByRole('button', { name: 'Reasignar responsable', exact: true }).click();
  await expect(page.getByText('Anterior · Anterior', { exact: true })).toBeVisible(); await expect(page.getByText('Nueva · Vigente', { exact: true })).toBeVisible();
  expect(writes).toEqual([{ path: '/api/v2/key-results/8/goals', version: '4' }, { path: '/api/v2/key-results/8/assignee', version: '5' }]);
  expect(await page.getByRole('main').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
});

test('records explicit policy minimums and activates an eligible KR at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem('sgp_session_user', JSON.stringify({ id: '1', nombre: 'Administrador', correo: 'admin@test', rol: 'admin', iniciales: 'AD' })));
  const policies: unknown[] = []; const writes: { path: string; version?: string }[] = [];
  const kr = { id: 8, name: 'Retención', description: 'Tasa anual', baseValue: 40, targetValue: 70, status: 'DRAFT', type: 'COMMITTED', version: 0, active: true, departmentId: 10, responsibleId: 1, linkedGoalIds: [3], linkedBetIds: [] };
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname; let data: unknown = [];
    if (['POST', 'PATCH'].includes(route.request().method())) {
      writes.push({ path, version: route.request().headers()['if-match'] });
      if (path.endsWith('/policies/kr-links')) { const p = { ...route.request().postDataJSON(), id: 1, version: 1, recordedBy: 'Administrador', approvedAt: '2026-01-02T12:00:00Z', effectiveAt: '2026-01-02T12:00:00Z' }; policies.push(p); data = p; }
      if (path.endsWith('/status')) { kr.status = 'ACTIVE'; kr.version++; data = kr; }
    } else if (path.endsWith('/policies/kr-links')) data = policies;
    else if (path.endsWith('/search')) data = { items: [kr], totalElements: 1, totalPages: 1, currentPage: 0, pageSize: 20 };
    else if (path === '/api/v2/key-results/8') data = kr;
    else if (path.endsWith('/relations')) data = { goals: [{ id: 1, targetId: 3, name: 'Permanencia', startedAt: '2026-01-01T12:00:00Z', endedAt: null, actorName: 'Administrador' }], bets: [], assignments: [] };
    else if (path.endsWith('/activation-check')) data = { ready: !!policies.length && kr.status === 'DRAFT', policyVersion: policies.length ? 1 : undefined, checks: [{ code: 'POLICY', passed: !!policies.length, actual: policies.length ? 1 : 0, required: 1 }, { code: 'GOALS', passed: !!policies.length, actual: 1, required: policies.length ? 1 : undefined }] };
    else if (path.endsWith('/strategy-choices')) data = { goals: [{ id: 3, name: 'Permanencia' }], bets: [] };
    if(path.endsWith('/history/search')&&Array.isArray(data))data={items:data,totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/entries/search')&&Array.isArray(data))data={items:data,totalElements:data.length,totalPages:data.length?1:0,currentPage:0,pageSize:20};
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ state: 'READY', data }) });
  });
  await page.goto('/resultados'); await page.getByLabel('KR para vínculos y responsables').selectOption('8');
  await expect(page.getByRole('button', { name: 'Activar KR', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: 'Consultar políticas' }).click();
  await page.getByLabel('Mínimo de Metas vinculadas').fill('1'); await page.getByLabel('Mínimo de Apuestas vinculadas').fill('0');
  await page.getByLabel('Referencia de la decisión aprobada').fill('https://example.org/decision'); await page.getByLabel('Motivo y contexto de la decisión').fill('Decisión institucional');
  await page.getByLabel(/Confirmo que estos mínimos/).check(); await page.getByRole('button', { name: 'Registrar decisión', exact: true }).click();
  await expect(page.getByText('Versión 1 · Más reciente', { exact: true })).toBeVisible();
  expect(await page.getByRole('main').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await page.goto('/resultados'); await page.getByLabel('KR para vínculos y responsables').selectOption('8');
  await page.getByLabel('Motivo de activación').fill('Inicio de ciclo'); await page.getByRole('button', { name: 'Activar KR', exact: true }).click();
  await expect(page.getByText('El KR está activo.', { exact: false })).toBeVisible();
  expect(writes).toEqual([{ path: '/api/v2/policies/kr-links', version: '0' }, { path: '/api/v2/key-results/8/status', version: '0' }]);
  expect(await page.getByRole('main').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: 'test-results/politica-activacion-320.png', fullPage: true });
});

test('monitoring displays four parallel branches and records a departmental observation at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem('sgp_session_user', JSON.stringify({ id: '1', nombre: 'Jefe', correo: 'jefe@test', rol: 'manager', iniciales: 'JF' })));
  const asOf = '2026-10-01T12:00:00Z'; const entries: unknown[] = []; const writes: string[] = [];
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname; let data: unknown = [];
    if (path === '/api/v2/monitoring-cuts') data = [{ id: 1, schoolId: 1, schoolName: 'Escuela', cycleName: 'Ciclo anual', cutCode: 'CORTE-1', cutDate: '2026-10-01', status: 'CONSOLIDATED', version: 2, asOf, canManage: false }];
    if (path.endsWith('/branches')) data = ['RECTOR', 'DECANO', 'DIRECTOR', 'DEPARTMENT'].map((branchType, index) => ({ id: index + 1, cutId: 1, branchType, status: 'OPEN', asOf, canRecord: branchType === 'DEPARTMENT' }));
    if (path.endsWith('/departments')) data = [{ id: 10, name: 'D1' }];
    if ((path === '/api/v2/monitoring-branches/4/entries' || path === '/api/v2/monitoring-branches/4/entries/search')) {
      if (route.request().method() === 'POST') { writes.push(path); entries.push({ ...route.request().postDataJSON(), id: 1, actorName: 'Jefe', actorRole: 'JEFE', statusResult: 'NO_SITUATIONS', createdAt: asOf }); }
      data = entries;
    }
    if(path.endsWith('/history/search')&&Array.isArray(data))data={items:data,totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/entries/search')&&Array.isArray(data))data={items:data,totalElements:data.length,totalPages:data.length?1:0,currentPage:0,pageSize:20};
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ state: 'READY', data }) });
  });
  await page.goto('/monitoreo'); await page.getByLabel('Corte de monitoreo').selectOption('1');
  for (const name of ['Institución · Rector', 'Facultad · Decano', 'Escuela · Director', 'Departamento · Jefe']) await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Consultar Departamento · Jefe' }).click();
  await page.getByLabel('Departamento del monitoreo').selectOption('10'); await page.getByLabel('Observación de monitoreo').fill('Seguimiento paralelo');
  await page.getByLabel('Resultado de la revisión').selectOption('NONE'); await page.getByRole('button', { name: 'Registrar observación departamental' }).click();
  await expect(page.getByText('Seguimiento paralelo', { exact: true })).toBeVisible();
  expect(writes).toEqual(['/api/v2/monitoring-branches/4/entries']);
  expect(await page.getByRole('main').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
});

test('resolves a monitoring situation with evidence and preserves its original finding on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem('sgp_session_user', JSON.stringify({ id: '1', nombre: 'Director', correo: 'director@test', rol: 'manager', iniciales: 'DI' })));
  const asOf = '2026-10-01T12:00:00Z'; const writes: { path: string; version?: string; body: unknown }[] = [];
  const situation = { id: 3, situationId: 7, title: 'Riesgo de continuidad', description: 'Hallazgo original', severity: 'HIGH', status: 'OPEN', version: 0, canManage: true, history: [] as unknown[] };
  const oldHistory=Array.from({length:101},(_,i)=>({id:i+10,previousStatus:'OPEN',newStatus:'IN_PROGRESS',comment:i===100?'Atención histórica original':'Antecedente',actorName:'Autor histórico',changedBy:'1',changedAt:asOf,evidenceUrl:i===100?'https://example.org/old-history':undefined}));
  await page.route('**/api/**', async route => {
    const url=new URL(route.request().url());const path=url.pathname; let data: unknown = [];
    if (path === '/api/v2/monitoring-cuts') data = [{ id: 1, schoolId: 1, schoolName: 'Escuela', cycleName: 'Ciclo', cutCode: 'CORTE-1', cutDate: '2026-10-01', status: 'CONSOLIDATED', version: 2, asOf, canManage: false }];
    if (path.endsWith('/branches')) data = [{ id: 2, cutId: 1, branchType: 'DIRECTOR', status: 'REVIEWED', asOf, canRecord: true }];
    if ((path.endsWith('/entries') || path.endsWith('/entries/search'))) data = [{ id: 1, actorName: 'Director', actorRole: 'DIRECTOR', observation: 'Hallazgo original', statusResult: 'WITH_SITUATIONS', createdAt: asOf, evidenceUrls: [], situations: [{ ...situation, escalationLevel: 'DECANO' }] }];
    if (path === '/api/v2/monitoring-situations/3') data = situation;
    if(path==='/api/v2/monitoring-situations/3/history/search'){const historyPage=Number(url.searchParams.get('page')??0);data={items:historyPage?oldHistory.slice(historyPage*20,(historyPage+1)*20):situation.history,totalElements:101,totalPages:6,currentPage:historyPage,pageSize:20};}
    if (path === '/api/v2/monitoring-situations/3/status') {
      const body = route.request().postDataJSON(); writes.push({ path, version: route.request().headers()['if-match'], body });
      situation.history.push({ id: 1, previousStatus: situation.status, newStatus: body.status, comment: body.comment, actorName: 'Director', changedBy: '1', changedAt: asOf, evidenceUrl: body.evidenceUrl });
      situation.status = body.status; situation.version++; data = situation;
    }
    if(path.endsWith('/history/search')&&Array.isArray(data))data={items:data,totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/entries/search')&&Array.isArray(data)){const old=url.searchParams.get('page')==='1';data={items:old?[]:data,totalElements:21,totalPages:2,currentPage:old?1:0,pageSize:20};}
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ state: 'READY', data }) });
  });
  await page.goto('/monitoreo'); await page.getByLabel('Corte de monitoreo').selectOption('1');
  await page.getByRole('button', { name: 'Consultar Escuela · Director' }).click();
  await page.getByRole('button', { name: 'Consultar seguimiento de situación' }).click();
  await page.getByLabel('Nuevo estado de situación').selectOption('RESOLVED');
  await page.getByLabel('Motivo o resolución').fill('Corrección verificada'); await page.getByLabel('Evidencia del seguimiento').fill('https://example.org/acta');
  for(let i=0;i<5;i++)await page.getByRole('button',{name:'Página siguiente de seguimiento de situación'}).click();
  await expect(page.getByText('Atención histórica original',{exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Consultar evidencia del cambio'})).toHaveAttribute('href','https://example.org/old-history');
  await expect(page.getByLabel('Motivo o resolución')).toHaveValue('Corrección verificada');
  await page.getByRole('button',{name:'Observaciones siguientes'}).click();await expect(page.getByText('Sin registros disponibles en tu ámbito.',{exact:true})).toBeVisible();await expect(page.getByLabel('Motivo o resolución')).toHaveValue('Corrección verificada');
  await page.getByRole('button', { name: 'Registrar estado de situación' }).click();
  await expect(page.getByText('Abierta → Resuelta', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Consultar evidencia del cambio' })).toHaveAttribute('href', 'https://example.org/acta');
  await page.getByRole('button',{name:'Observaciones anteriores'}).click();
  await expect(page.getByText('Con situaciones', { exact: true })).toBeVisible();
  expect(writes).toEqual([{ path: '/api/v2/monitoring-situations/3/status', version: '0', body: { status: 'RESOLVED', comment: 'Corrección verificada', evidenceUrl: 'https://example.org/acta' } }]);
  expect(await page.getByRole('main').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: 'test-results/situacion-resuelta-320.png', fullPage: true });
});

test('creates and completes a departmental corrective action at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem('sgp_session_user', JSON.stringify({ id: '1', nombre: 'Jefe', correo: 'jefe@test', rol: 'manager', iniciales: 'JF' })));
  const asOf = '2026-10-01T12:00:00Z'; const writes: { path: string; version?: string }[] = []; const actions: any[] = [];
  const finding = { id: 3, situationId: 7, title: 'Riesgo local', description: 'Hallazgo', severity: 'HIGH', status: 'OPEN', version: 0, canManage: true, canCreateCorrective: true, branchType: 'DEPARTMENT', history: [] };
  await page.route('**/api/**', async route => {
    const url=new URL(route.request().url());const path=url.pathname; const method = route.request().method(); let data: unknown = [];
    if (path === '/api/v2/monitoring-cuts') data = [{ id: 1, schoolId: 1, schoolName: 'Escuela', cycleName: 'Ciclo', cutCode: 'CORTE-1', cutDate: '2026-10-01', status: 'CONSOLIDATED', version: 2, asOf, canManage: false }];
    if (path.endsWith('/branches')) data = [{ id: 4, cutId: 1, branchType: 'DEPARTMENT', status: 'OPEN', asOf, canRecord: false }];
    if ((path.endsWith('/entries') || path.endsWith('/entries/search'))) data = [{ id: 1, actorName: 'Jefe', actorRole: 'JEFE', observation: 'Hallazgo', statusResult: 'WITH_SITUATIONS', createdAt: asOf, evidenceUrls: [], situations: [finding] }];
    if (path === '/api/v2/monitoring-situations/3') data = finding;
    if (path.endsWith('/corrective-responsibles')) data = [{ id: 2, name: 'Responsable local' }];
    if (path.endsWith('/corrective-actions')) {
      if (method === 'POST') { writes.push({ path }); actions.push({ ...route.request().postDataJSON(), id: 8, version: 0, status: 'PENDING', responsibleName: 'Responsable local', canManage: true, history: Array.from({length:101},(_,i)=>({id:i+10,previousStatus:'PENDING',newStatus:'IN_PROGRESS',comment:i===100?'Antecedente original del correctivo':'Antecedente',actorName:'Jefe',changedAt:asOf,evidenceUrl:i===100?'https://example.org/history-original':undefined})) });for(let i=0;i<100;i++)actions.push({...actions[0],id:100+i,decisionDescription:'Correctivo posterior',history:[]}); }
      data = method==='POST'?actions[0]:actions;
    }
    if (path.endsWith('/corrective-actions/search')){const currentPage=Number(url.searchParams.get('page')??0);data={items:[...actions].reverse().slice(currentPage*20,(currentPage+1)*20),totalElements:actions.length,totalPages:Math.ceil(actions.length/20),currentPage,pageSize:20};}
    if (path.endsWith('/corrective-actions/8')&&method==='GET')data=actions[0];
    if (path.endsWith('/corrective-actions/8')&&method==='PATCH') {
      const body = route.request().postDataJSON(); writes.push({ path, version: route.request().headers()['if-match'] });
      actions[0].history.unshift({ id: 1, previousStatus: actions[0].status, newStatus: body.status, comment: body.comment, actorName: 'Jefe', changedAt: asOf, evidenceUrl: body.evidenceUrl }); actions[0].status = body.status; actions[0].version++; data = actions[0];
    }
    if(path.endsWith('/corrective-actions/8/history/search')){const currentPage=Number(url.searchParams.get('page')??0);const history=actions[0]?.history??[];data={items:history.slice(currentPage*20,(currentPage+1)*20),totalElements:history.length,totalPages:Math.ceil(history.length/20),currentPage,pageSize:20};}
    if(path.endsWith('/history/search')&&Array.isArray(data))data={items:data,totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/entries/search')&&Array.isArray(data))data={items:data,totalElements:data.length,totalPages:data.length?1:0,currentPage:0,pageSize:20};
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ state: 'READY', data }) });
  });
  await page.goto('/monitoreo'); await page.getByLabel('Corte de monitoreo').selectOption('1'); await page.getByRole('button', { name: 'Consultar Departamento · Jefe' }).click(); await page.getByRole('button', { name: 'Consultar seguimiento de situación' }).click();
  await page.getByLabel('Responsable de acción correctiva').selectOption('2'); await page.getByLabel('Fecha límite de acción correctiva').fill('2026-12-01'); await page.getByLabel('Decisión correctiva').fill('Revisar causa'); await page.getByRole('button', { name: 'Crear acción correctiva' }).click();
  await page.getByLabel('Decisión correctiva').fill('Segundo borrador');
  await page.getByLabel('Estado de acción 8').selectOption('COMPLETED'); await page.getByLabel('Motivo de acción 8').fill('Verificado'); await page.getByLabel('Evidencia de acción 8').fill('https://example.org/correctivo');
  for(let i=0;i<5;i++)await page.getByRole('button',{name:'Página siguiente de acciones correctivas'}).click();
  await expect(page.getByRole('button',{name:'Consultar acción 8'})).toBeVisible();
  for(let i=0;i<5;i++)await page.getByRole('button',{name:'Página siguiente de historial de acción 8'}).click();
  await expect(page.getByText('Antecedente original del correctivo',{exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Consultar evidencia de la acción'})).toHaveAttribute('href','https://example.org/history-original');
  await expect(page.getByLabel('Decisión correctiva')).toHaveValue('Segundo borrador');await expect(page.getByLabel('Motivo de acción 8')).toHaveValue('Verificado');
  await page.getByRole('button', { name: 'Registrar cambio de acción 8' }).click();
  await expect(page.getByText('Pendiente → Completada', { exact: true })).toBeVisible(); await expect(page.getByRole('link', { name: 'Consultar evidencia de la acción' })).toHaveAttribute('href', 'https://example.org/correctivo');
  expect(writes).toEqual([{ path: '/api/v2/monitoring-situations/3/corrective-actions' }, { path: '/api/v2/monitoring-situations/3/corrective-actions/8', version: '0' }]);
  await expect(page.getByLabel('Decisión correctiva')).toHaveValue('Segundo borrador');
  expect(await page.getByRole('main').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
});

test('reads frozen cut report sections and filters departments at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem('sgp_session_user', JSON.stringify({ id: '1', nombre: 'Director', correo: 'director@test', rol: 'manager', iniciales: 'DI' })));
  const asOf = '2026-10-01T12:00:00Z'; const reads: string[] = []; const exports: string[] = [];
  const cut = { id: 1, schoolId: 1, schoolName: 'Escuela', cycleName: 'Ciclo', cutCode: 'CORTE-1', cutDate: '2026-10-01', status: 'CONSOLIDATED', version: 2, asOf, canManage: false };
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url()); const path = url.pathname; let data: unknown = [];
    if (path.endsWith('/report/export.csv')) { exports.push(url.search); await route.fulfill({ contentType: 'text/csv; charset=utf-8', body: 'as_of,section,title\r\n2026-10-01,keyResults,Retención\r\n' }); return; }
    if (path === '/api/v2/monitoring-cuts') data = [cut];
    if (path.endsWith('/report')) {
      reads.push(url.search); const selected = url.searchParams.get('departmentId');
      data = { cut, asOf, captureVersion: 1, policy: { version: 2 }, departments: [{ id: 10, name: 'D1' }, { id: 20, name: 'D2' }], keyResultsCaptured: true, initiativesCaptured: true, tasksCaptured: true, keyResults: [{ id: 1, name: 'Retención capturada', version: 3, status: 'ACTIVE', departmentId: 10, departmentName: 'D1', baseValue: 40, targetValue: 70, measuredValue: 52, manualProgress: null }], initiatives: selected === '10' ? [] : [{ id: 2, keyResultId: 1, title: 'Iniciativa D2', departmentName: 'D2', manualProgress: 0, status: 'IN_PROGRESS' }], tasks: [] };
    }
    if(path.endsWith('/history/search')&&Array.isArray(data))data={items:data,totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/entries/search')&&Array.isArray(data))data={items:data,totalElements:data.length,totalPages:data.length?1:0,currentPage:0,pageSize:20};
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ state: 'READY', data }) });
  });
  await page.goto('/monitoreo'); await page.getByLabel('Corte de monitoreo').selectOption('1'); await page.getByRole('button', { name: 'Consultar informe del corte' }).click();
  await expect(page.getByText('Avance manual del KR: Sin declaración', { exact: true })).toBeVisible(); await expect(page.getByText('Avance manual de iniciativa: 0 %', { exact: true })).toBeVisible();
  await page.getByLabel('Departamento del informe').selectOption('10'); await expect(page.getByText('Sin iniciativas capturadas en este ámbito.', { exact: true })).toBeVisible(); await expect(page.getByText('Iniciativa D2', { exact: true })).toHaveCount(0);
  expect(reads).toEqual(['', '?departmentId=10']); expect(await page.getByRole('main').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  const downloadEvent = page.waitForEvent('download'); await page.getByRole('button', { name: 'Descargar CSV del informe' }).click(); const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('corte-1.csv'); expect(exports).toEqual(['?departmentId=10']);
});

test('confirms a departmental result without changing progress at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 }); await page.addInitScript(() => sessionStorage.setItem('sgp_session_user', JSON.stringify({ id: '1', nombre: 'Jefe', correo: 'jefe@test', rol: 'manager', iniciales: 'JF' })));
  const asOf = '2026-10-01T12:00:00Z'; const writes: { path:string;version?:string;body:unknown }[] = [];
  const result = { id:1,departmentId:10,departmentName:'D1',version:0,latestEntryId:7,latestObservation:'Resultado de D1',canSubmit:true,entryId:null as number|null,submittedAt:null as string|null,submittedBy:'Jefe',observation:'Resultado de D1' };
  await page.route('**/api/**', async route => {
    const url=new URL(route.request().url());const path=url.pathname; let data:unknown = [];
    if (path === '/api/v2/monitoring-cuts') data=[{id:1,schoolId:1,schoolName:'Escuela',cycleName:'Ciclo',cutCode:'CORTE-1',cutDate:'2026-10-01',status:'CONSOLIDATED',version:2,asOf,canManage:false}];
    if(path.endsWith('/branches'))data=[{id:4,cutId:1,branchType:'DEPARTMENT',status:result.submittedAt?'SUBMITTED':'OPEN',asOf,canRecord:true}];
    if(path.endsWith('/department-results')) { if(route.request().method()==='POST'){writes.push({path,version:route.request().headers()['if-match'],body:route.request().postDataJSON()});result.version++;result.entryId=7;result.submittedAt=asOf;result.canSubmit=false;}data=[result]; }
    if((path.endsWith('/entries') || path.endsWith('/entries/search')))data=[{id:7,departmentId:10,observation:'Resultado de D1',actorName:'Jefe',actorRole:'JEFE',statusResult:'NO_SITUATIONS',createdAt:asOf,evidenceUrls:[],situations:[]}];
    if(path.endsWith('/department-results/10/history')){const old=url.searchParams.get('page')==='1';data={items:[{id:old?101:1,version:old?1:21,current:!old,entryId:7,submittedAt:asOf,deliveredBy:'Jefe',observation:old?'Entrega anterior documentada':'Resultado de D1',entryActorName:'Profesora',entryActorRole:'JEFE',entryCreatedAt:asOf,evidenceUrls:['https://example.org/acta']}],totalElements:21,totalPages:2,currentPage:old?1:0,pageSize:20};}
    if(path.endsWith('/history/search')&&Array.isArray(data))data={items:data,totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/entries/search')&&Array.isArray(data))data={items:data,totalElements:data.length,totalPages:data.length?1:0,currentPage:0,pageSize:20};
    await route.fulfill({contentType:'application/json',body:JSON.stringify({state:'READY',data})});
  });
  await page.goto('/monitoreo');await page.getByLabel('Corte de monitoreo').selectOption('1');await page.getByRole('button',{name:'Consultar Departamento · Jefe'}).click();
  await expect(page.getByRole('button',{name:'Entregar resultado de D1'})).toBeDisabled();await page.getByRole('checkbox',{name:'Confirmo la entrega del resultado de D1'}).check();await page.getByRole('button',{name:'Entregar resultado de D1'}).click();
  await page.getByRole('button',{name:'Consultar historial de entregas de D1'}).click();await page.getByRole('button',{name:'Entregas siguientes'}).click();await page.getByText('Consultar observación entregada #7',{exact:true}).click();await expect(page.getByText('Entrega anterior documentada',{exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Evidencia de la observación 1'})).toHaveAttribute('href','https://example.org/acta');
  await expect(page.getByRole('heading',{name:'D1 · Entregado'})).toBeVisible();expect(writes).toEqual([{path:'/api/v2/monitoring-branches/4/department-results',version:'0',body:{departmentId:10,entryId:7,confirmed:true}}]);expect(await page.getByRole('main').evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
});

test('creates a school report draft with its captured values at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });await page.addInitScript(() => sessionStorage.setItem('sgp_session_user',JSON.stringify({id:'1',nombre:'Director',correo:'director@test',rol:'manager',iniciales:'DI'})));
  const asOf='2026-10-01T12:00:00Z';const reports:any[]=[];const writes:{path:string;version?:string}[]=[];
  const capturedEntries=Array.from({length:101},(_,i)=>({id:i+1,observation:i===100?'Observación histórica original':'Observación capturada',actorName:'Director capturado',actorRole:'DIRECTOR',createdAt:asOf,evidenceUrls:i===100?['https://example.org/entry-original']:[],situations:[]}));
  const capturedHistory=Array.from({length:101},(_,i)=>({id:i+1,previousStatus:'OPEN',newStatus:'IN_PROGRESS',comment:i===100?'Comentario histórico original':'Antecedente capturado',actorName:'Autor original',changedBy:'1',changedAt:asOf,evidenceUrl:i===100?'https://example.org/finding-original':undefined}));
  const capturedSituations=[{id:7,situationId:4,title:'Hallazgo capturado',description:'Descripción capturada',severity:'HIGH',status:'IN_PROGRESS',version:1,canManage:false,history:capturedHistory,correctiveActions:[]}];
  const cut={id:1,schoolId:1,schoolName:'Escuela',cycleName:'Ciclo',cutCode:'CORTE-1',cutDate:'2026-10-01',status:'CONSOLIDATED',version:2,asOf,canManage:true};
  await page.route('**/api/**',async route=>{const path=new URL(route.request().url()).pathname;let data:unknown=[];
    if(path==='/api/v2/monitoring-cuts')data=[cut];
    if(path.endsWith('/final-reports'))data=reports;
    if(path.endsWith('/final-reports/search'))data={items:reports,totalElements:reports.length,totalPages:reports.length?1:0,currentPage:0,pageSize:20,latestVersion:reports[reports.length-1]?.version??0};
    if(path==='/api/v2/school-final-reports'&&route.request().method()==='POST'){writes.push({path,version:route.request().headers()['if-match']});const body=route.request().postDataJSON();const report={...body,id:7,version:1,status:'DRAFT',authorName:'Director',generatedAt:asOf,formatPolicyApproved:false,content:{assembledAt:asOf,cutReport:{cut,asOf,captureVersion:1,policy:{version:1},departments:[],keyResultsCaptured:true,initiativesCaptured:true,tasksCaptured:true,keyResults:[{id:1,name:'Retención capturada',version:1,status:'ACTIVE',baseValue:40,targetValue:70,measuredValue:52,manualProgress:null}],initiatives:[],tasks:[]},branchResults:['RECTOR','DECANO','DIRECTOR','DEPARTMENT'].map((branchType,index)=>({branch:{id:index+1,branchType,status:branchType==='DEPARTMENT'?'SUBMITTED':'REVIEWED'},entries:branchType==='DEPARTMENT'?capturedEntries:[]})),situations:capturedSituations}};reports.push(report);data=report;}
    if(path.endsWith('/history/search')&&Array.isArray(data))data={items:data,totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/entries/search')&&Array.isArray(data))data={items:data,totalElements:data.length,totalPages:data.length?1:0,currentPage:0,pageSize:20};
    await route.fulfill({contentType:'application/json',body:JSON.stringify({state:'READY',data})});
  });
  await page.goto('/monitoreo');await page.getByLabel('Corte de monitoreo').selectOption('1');await page.getByRole('button',{name:'Consultar borradores finales'}).click();
  await page.getByLabel('Título del informe final').fill('Informe anual');await page.getByLabel('Logros del periodo').fill('Logros');await page.getByLabel('Dificultades del periodo').fill('Dificultades');await page.getByLabel('Conclusiones del informe').fill('Conclusiones');await page.getByRole('button',{name:'Generar versión de borrador'}).click();
  await expect(page.getByText('Estado: DRAFT',{exact:true})).toBeVisible();await expect(page.getByText('Valor medido: 52',{exact:true})).toBeVisible();await expect(page.getByText('Avance manual del KR: Sin declaración',{exact:true})).toBeVisible();
  const capturedBranch=page.getByRole('region',{name:'Rama capturada DEPARTMENT'});
  for(let i=0;i<5;i++)await capturedBranch.getByRole('button',{name:'Página siguiente de observaciones capturadas de DEPARTMENT'}).click();
  await expect(capturedBranch.getByText('Observación histórica original',{exact:true})).toBeVisible();
  await expect(capturedBranch.getByRole('link',{name:'Consultar evidencia capturada 1'})).toHaveAttribute('href','https://example.org/entry-original');
  await page.getByText('Seguimientos capturados de la situación 7 (101)',{exact:true}).click();
  for(let i=0;i<5;i++)await page.getByRole('button',{name:'Página siguiente de Seguimientos capturados de la situación 7'}).click();
  await expect(page.getByText('Comentario histórico original',{exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Consultar evidencia del seguimiento 101'})).toHaveAttribute('href','https://example.org/finding-original');
  expect(writes).toEqual([{path:'/api/v2/school-final-reports',version:'0'}]);expect(await page.getByRole('main').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
});

test('reads structural consistency while showing pending policy rules on mobile', async ({ page }) => {
  await page.setViewportSize({width:320,height:900});await page.addInitScript(()=>sessionStorage.setItem('sgp_session_user',JSON.stringify({id:'1',nombre:'Gestor',correo:'gestor@test',rol:'manager',iniciales:'GS'})));
  const writes:string[]=[];await page.route('**/api/**',async route=>{const path=new URL(route.request().url()).pathname;let data:unknown=[];if(route.request().method()!=='GET')writes.push(path);if(path==='/api/v2/cycles')data=[{id:1,name:'Ciclo'}];if(path.endsWith('/consistency/departments'))data=[{id:10,name:'D1'}];if(path.endsWith('/consistency/check'))data={cycleId:1,auditStatus:'POLICY_UNSET',evaluationStatus:'PARTIAL',blockedRules:['KR_GOAL_MINIMUM','KR_BET_MINIMUM','PLANNER_FRESHNESS'],checked:{keyResults:1,initiatives:0,taskReferences:0},asOf:'2026-10-01T12:00:00Z',totalFindings:1,findings:[{findingId:'KR:7:OWNER',ruleCode:'KR_OWNER',entityType:'KR',entityId:7,severity:'HIGH',title:'Retención',description:'Sin responsable activo',recommendedAction:'Revisar responsable'}]};await route.fulfill({contentType:'application/json',body:JSON.stringify({state:'READY',data})});});
  await page.goto('/consistencia-estrategica');await page.getByLabel('Ciclo de consistencia').selectOption('1');await expect(page.getByText('Sin responsable activo',{exact:true})).toBeVisible();await expect(page.getByText(/Evaluación parcial/)).toBeVisible();await page.getByLabel('Severidad del hallazgo').selectOption('MEDIUM');await expect(page.getByText(/Las reglas pendientes no se consideran aprobadas/)).toBeVisible();expect(writes).toEqual([]);expect(await page.getByRole('main').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
});

test('opens an initiative reference outside the recent list without writing', async ({ page }) => {
  await page.setViewportSize({width:320,height:900});
  await page.addInitScript(()=>sessionStorage.setItem('sgp_session_user',JSON.stringify({id:'1',nombre:'Gestor',correo:'gestor@test',rol:'manager',iniciales:'GS'})));
  const writes:string[]=[];
  await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(route.request().method()!=='GET')writes.push(path);
    let data:unknown=path==='/api/v2/initiatives/703'?{id:703,keyResultId:7,departmentId:10,departmentName:'D1',title:'Iniciativa referenciada',description:'Fuera de los 100 recientes',status:'DRAFT',active:true,version:0,responsibleId:2,responsibleName:'Responsable',progressPercent:null}:[];
    if(path.endsWith('/planner-references'))data={items:[{id:1,titleSnapshot:'Tarea registrada',externalPlanId:'plan',externalTaskId:'task',externalUrl:'https://planner.cloud.microsoft/task/task',connectionState:'REVOKED',lastSyncedAt:'2026-10-01T12:00:00Z'}],totalElements:1,totalPages:1,currentPage:0,pageSize:20,source:'REGISTERED_REFERENCES'};
    if(path.endsWith('/execution/search'))data={items:[],totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/evidence/search'))data={items:[],totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path==='/api/v2/key-results/search')data={items:[],totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path==='/api/v2/initiatives/search'||(path.endsWith('/progress/search') || path.endsWith('/assignments/search')))data={items:[],totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/history/search')&&Array.isArray(data))data={items:data,totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/entries/search')&&Array.isArray(data))data={items:data,totalElements:data.length,totalPages:data.length?1:0,currentPage:0,pageSize:20};
    await route.fulfill({contentType:'application/json',body:JSON.stringify({state:'READY',data})});
  });
  await page.goto('/iniciativas?initiative=703');
  await expect(page.getByRole('heading',{name:'Seguimiento · Iniciativa referenciada'})).toBeVisible();
  await expect(page.getByText('Sin iniciativas para esta página y filtros.',{exact:true})).toBeVisible();
  await expect(page.getByText('Tarea registrada',{exact:true})).toBeVisible();
  await expect(page.getByText('Conexión revocada',{exact:true})).toBeVisible();
  expect(writes).toEqual([]);
  expect(await page.getByRole('main').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
});

test('opens evidence from an older measurement page independently of manual progress', async ({ page }) => {
  await page.setViewportSize({width:320,height:900});
  await page.addInitScript(()=>sessionStorage.setItem('sgp_session_user',JSON.stringify({id:'1',nombre:'Gestor',correo:'gestor@test',rol:'manager',iniciales:'GS'})));
  const writes:string[]=[];let progressReads=0;
  await page.route('**/api/**',async route=>{
    const url=new URL(route.request().url());const path=url.pathname;let data:unknown=[];
    if(route.request().method()!=='GET')writes.push(path);
    if(path==='/api/v2/key-results/1/tracking')data={id:1,name:'Retención',unitName:'%',unitType:'PORCENTAJE',version:1,active:true,status:'ACTIVO',measuredValue:60,progressPercent:null,progressStatus:null};
    if(path==='/api/v2/key-results/search')data={items:[],totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/measurements/search')){const old=url.searchParams.get('page')==='1';data={items:[{id:old?101:1,keyResultId:1,measuredValue:old?25:60,observedAt:'2026-01-01T12:00:00Z',registeredAt:'2026-01-02T12:00:00Z',registeredBy:'Gestor',status:old?'REVISED':'ACTIVE',version:0}],totalElements:21,totalPages:2,currentPage:old?1:0,pageSize:20};}
    if(path.endsWith('/progress/search')){progressReads++;data={items:[],totalElements:0,totalPages:0,currentPage:0,pageSize:20};}
    if(path==='/api/v2/measurements/101/evidence/search')data={items:[{id:1,title:'Acta histórica',evidenceType:'DOCUMENT',externalRef:'https://example.org/old',active:false,createdBy:'Gestor',createdAt:'2026-01-01T12:00:00Z'}],totalElements:1,totalPages:1,currentPage:0,pageSize:20};
    if(path.endsWith('/history/search')&&Array.isArray(data))data={items:data,totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/entries/search')&&Array.isArray(data))data={items:data,totalElements:data.length,totalPages:data.length?1:0,currentPage:0,pageSize:20};
    await route.fulfill({contentType:'application/json',body:JSON.stringify({state:'READY',data})});
  });
  await page.goto('/seguimiento?kr=1');await page.getByRole('button',{name:'Página siguiente de mediciones'}).click();
  await page.getByLabel('Evidencias de la medición').selectOption('101');
  await expect(page.getByText('Acta histórica',{exact:true})).toBeVisible();
  await expect(page.getByLabel('Título de evidencia')).toHaveCount(0);
  expect(progressReads).toBe(1);expect(writes).toEqual([]);
  expect(await page.getByRole('main').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
});

test('creates an initiative from a searched KR outside the initial list at mobile width', async ({ page }) => {
  await page.setViewportSize({width:320,height:900});await page.addInitScript(()=>sessionStorage.setItem('sgp_session_user',JSON.stringify({id:'1',nombre:'Gestor',correo:'gestor@test',rol:'manager',iniciales:'GS'})));
  const initiatives:unknown[]=[];const writes:{path:string;body:unknown}[]=[];
  await page.route('**/api/**',async route=>{
    const url=new URL(route.request().url());const path=url.pathname;let data:unknown=[];
    if(path==='/api/v2/initiatives')data=initiatives;
    if(path==='/api/v2/initiatives/search')data={items:initiatives,totalElements:initiatives.length,totalPages:initiatives.length?1:0,currentPage:0,pageSize:20};
    if(path==='/api/v2/initiatives/9')data=initiatives.find(entry=>(entry as {id:number}).id===9);
    if(path==='/api/v2/initiative-responsibles')data=[{id:2,name:'Responsable D1',departmentId:10,departmentName:'D1'},{id:3,name:'Responsable D2',departmentId:20,departmentName:'D2'}];
    if(path==='/api/v2/key-results/search'){const match=url.searchParams.get('text')==='Lejano';data={items:match?[{id:703,name:'KR Lejano'}]:[],totalElements:match?1:0,totalPages:match?1:0,currentPage:0,pageSize:20};}
    if(path==='/api/v2/key-results/703/tracking')data={id:703,name:'KR Lejano',departmentId:10,departmentName:'D1',active:true,status:'ACTIVE',version:0,measuredValue:null,progressPercent:null};
    if(path==='/api/v2/key-results/703/initiatives'&&route.request().method()==='POST'){const body=route.request().postDataJSON();writes.push({path,body});const initiative={...body,id:9,departmentName:'D1',responsibleName:'Responsable D1',active:true,status:'DRAFT',progressPercent:0,version:0};initiatives.push(initiative);data=initiative;}
    if(path.endsWith('/evidence/search')||path.endsWith('/execution/search')||path.endsWith('/planner-references')||(path.endsWith('/progress/search') || path.endsWith('/assignments/search')))data={items:[],totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/history/search')&&Array.isArray(data))data={items:data,totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/entries/search')&&Array.isArray(data))data={items:data,totalElements:data.length,totalPages:data.length?1:0,currentPage:0,pageSize:20};
    await route.fulfill({contentType:'application/json',body:JSON.stringify({state:'READY',data})});
  });
  await page.goto('/iniciativas');await page.getByLabel('Buscar KR para la iniciativa').fill('Lejano');await page.getByRole('button',{name:'Buscar KRs'}).click();await page.getByLabel('KR asociado',{exact:true}).selectOption('703');
  await expect(page.getByText('Unidad del KR: D1',{exact:true})).toBeVisible();await expect(page.getByRole('option',{name:'Responsable D2 · D2'})).toHaveCount(0);
  await page.getByLabel('Responsable',{exact:true}).selectOption('2');await page.getByLabel('Título',{exact:true}).fill('Iniciativa nueva');await page.getByLabel('Descripción',{exact:true}).fill('Trabajo documentado');await page.getByRole('button',{name:'Registrar iniciativa',exact:true}).click();
  await expect(page.getByText('Iniciativa registrada sin modificar el avance del KR.',{exact:true})).toBeVisible();expect(writes).toEqual([{path:'/api/v2/key-results/703/initiatives',body:{keyResultId:703,responsibleId:2,title:'Iniciativa nueva',description:'Trabajo documentado',departmentId:10}}]);
  expect(await page.locator('form form').count()).toBe(0);expect(await page.getByRole('main').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
});

test('keeps a selected initiative while paging its older declarations and filtering the list', async ({ page }) => {
  await page.setViewportSize({width:320,height:900});await page.addInitScript(()=>sessionStorage.setItem('sgp_session_user',JSON.stringify({id:'1',nombre:'Gestor',correo:'gestor@test',rol:'manager',iniciales:'GS'})));
  const item={id:703,keyResultId:7,keyResultName:'KR capturado',departmentId:10,departmentName:'D1',title:'Histórica',description:'Trabajo antiguo',active:false,status:'INACTIVE',version:1,progressPercent:12};const writes:string[]=[];
  await page.route('**/api/**',async route=>{const url=new URL(route.request().url());const path=url.pathname;let data:unknown=[];if(route.request().method()!=='GET')writes.push(path);
    if(path==='/api/v2/initiatives/search'){const second=url.searchParams.get('page')==='1';const filtered=!!url.searchParams.get('text');data={items:second&&!filtered?[item]:[],totalElements:filtered?0:21,totalPages:filtered?0:2,currentPage:second?1:0,pageSize:20};}
    if(path==='/api/v2/initiatives/703')data=item;
    if(path==='/api/v2/initiatives/703/progress/search'){const second=url.searchParams.get('page')==='1';data={items:[{id:second?101:1,progressPercent:second?12:37,status:'ON_TRACK',comment:second?'Declaración histórica':'Reciente',actorName:'Gestor',occurredAt:'2026-01-01T12:00:00Z'}],totalElements:21,totalPages:2,currentPage:second?1:0,pageSize:20};}
    if(path==='/api/v2/key-results/search'||path.endsWith('/assignments/search')||path.endsWith('/evidence/search')||path.endsWith('/execution/search')||path.endsWith('/planner-references'))data={items:[],totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path==='/api/v2/initiatives/703/assignments/search'){const second=url.searchParams.get('page')==='1';data={items:[{id:second?101:1,professorId:2,name:second?'Responsable histórico':'Responsable vigente',actorName:'Gestor',startedAt:'2026-01-01T12:00:00Z',endedAt:second?'2026-01-02T12:00:00Z':null}],totalElements:21,totalPages:2,currentPage:second?1:0,pageSize:20};}
    if(path.endsWith('/history/search')&&Array.isArray(data))data={items:data,totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/entries/search')&&Array.isArray(data))data={items:data,totalElements:data.length,totalPages:data.length?1:0,currentPage:0,pageSize:20};
    await route.fulfill({contentType:'application/json',body:JSON.stringify({state:'READY',data})});
  });
  await page.goto('/iniciativas');await page.getByRole('button',{name:'Iniciativas siguientes'}).click();await page.getByRole('button',{name:'Ver seguimiento'}).click();
  await expect(page.getByRole('heading',{name:'Seguimiento · Histórica'})).toBeVisible();await page.getByRole('button',{name:'Declaraciones siguientes'}).click();await expect(page.getByText('Declaración histórica',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Asignaciones siguientes'}).click();await expect(page.getByText('Responsable histórico · Anterior',{exact:true})).toBeVisible();
  await page.getByLabel('Buscar iniciativa',{exact:true}).fill('Sin coincidencias');await page.getByRole('button',{name:'Buscar iniciativas',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Seguimiento · Histórica'})).toBeVisible();await expect(page.getByText('Declaración histórica',{exact:true})).toBeVisible();expect(writes).toEqual([]);expect(await page.getByRole('main').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
});

test('reads old KR versions and relations independently without discarding a change draft', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem('sgp_session_user', JSON.stringify({ id: '1', nombre: 'Gestor', correo: 'gestor@test', rol: 'manager', iniciales: 'GS' })));
  const kr = { id: 703, name: 'KR de referencia', description: 'Fuera de la lista', active: true, status: 'DRAFT', type: 'COMMITTED', version: 100, metricDefinitionId: 1, metricDefinitionName: 'Retención', baseValue: 40, targetValue: 70, strategicCycleId: 1, departmentId: 10, responsibleId: 2, linkedGoalIds: [9], linkedBetIds: [] };
  const writes: string[] = []; let versionReads = 0;
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url()); const path = url.pathname; let data: unknown = [];
    if (route.request().method() !== 'GET') writes.push(path);
    if (path === '/api/v2/key-results/search') data = { items: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 20 };
    if (path === '/api/v2/strategy-choices') data = { goals: [{ id: 9, name: 'Meta vigente' }], bets: [] };
    if (path === '/api/v2/key-results/703') data = kr;
    if (path === '/api/v2/key-results/703/activation-check') data = { ready: false, checks: [] };
    if (path.startsWith('/api/v2/key-results/703/relations/')) {
      const second = url.searchParams.get('page') === '1'; const assignment = path.endsWith('/assignments');
      data = { items: [{ id: second ? 101 : 1, targetId: 9, name: assignment ? 'Profesora anterior' : second ? 'Meta histórica' : 'Meta vigente', actorName: 'Gestor', startedAt: '2026-01-01T12:00:00Z', endedAt: second || assignment ? '2026-01-02T12:00:00Z' : null }], totalElements: 101, totalPages: 6, currentPage: second ? 1 : 0, pageSize: 20 };
    }
    if (path === '/api/v2/key-results/703/versions/search') {
      versionReads++; const currentPage = Number(url.searchParams.get('page')); const initial = currentPage === 5;
      data = { items: [{ id: currentPage + 1, version: 100 - currentPage * 20, reason: initial ? 'Alta original' : 'Revisión vigente', actorName: 'Gestor', occurredAt: '2026-01-01T12:00:00Z', snapshot: initial ? { after: { ...kr, baseValue: 0 } } : { before: { ...kr, baseValue: 30 }, after: kr } }], totalElements: 101, totalPages: 6, currentPage, pageSize: 20 };
    }
    if(path.endsWith('/history/search')&&Array.isArray(data))data={items:data,totalElements:0,totalPages:0,currentPage:0,pageSize:20};
    if(path.endsWith('/entries/search')&&Array.isArray(data))data={items:data,totalElements:data.length,totalPages:data.length?1:0,currentPage:0,pageSize:20};
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ state: 'READY', data }) });
  });
  await page.goto('/resultados?kr=703');
  await page.getByLabel('Motivo del cambio', { exact: true }).fill('Motivo en preparación');
  await expect(page.getByRole('option', { name: 'Meta vigente', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Página siguiente de metas' }).click();
  await expect(page.getByText('Meta histórica · Finalizado', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Motivo del cambio', { exact: true })).toHaveValue('Motivo en preparación');
  await page.getByRole('button', { name: 'Historial de cambios del KR referenciado' }).click();
  await expect(page.getByText('Revisión vigente', { exact: true })).toBeVisible();
  for (let currentPage = 1; currentPage <= 5; currentPage++) {
    await page.getByRole('button', { name: 'Versiones siguientes' }).click();
    await expect(page.getByRole('heading', { name: `Versión ${100 - currentPage * 20}`, exact: true })).toBeVisible();
  }
  await page.getByText('Ver definición inicial', { exact: true }).click();
  await expect(page.getByText('Registrado: 0', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Motivo del cambio', { exact: true })).toHaveValue('Motivo en preparación');
  expect(versionReads).toBe(6); expect(writes).toEqual([]);
  expect(await page.getByRole('main').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await page.getByRole('region', { name: 'Historial de cambios del KR', exact: true }).screenshot({ path: 'test-results/kr-history-320.png' });
});
