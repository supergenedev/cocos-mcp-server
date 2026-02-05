# Cocos Creator MCP Server 기능 QA 체크리스트

## 📋 개요
이 문서는 Cocos Creator MCP Server의 모든 도구에 대한 기능 QA 체크리스트입니다.
각 도구는 기본 기능, 에러 처리, 파라미터 검증, 반환값 검증, 엣지 케이스 등을 테스트해야 합니다.

**테스트 상태 표기:**
- ✅ 통과
- ❌ 실패
- ⚠️ 부분 통과 (이슈 있음)
- ⏸️ 미테스트

---

## 1. Scene Tools (7개 도구)

### 1.1 get_current_scene
- [ ] 정상 케이스: 현재 열려있는 씬 정보 반환
- [ ] 반환값 구조 검증 (name, path, uuid 포함)
- [ ] 에러 메시지 명확성

### 1.2 get_scene_list
- [ ] 정상 케이스: 프로젝트 내 모든 씬 목록 반환
- [ ] 빈 프로젝트에서 동작 확인
- [ ] 반환값 구조 검증 (배열, 각 항목에 name/path/uuid 포함)
- [ ] 대용량 프로젝트에서 성능 확인

### 1.3 open_scene
- [ ] 정상 케이스: 유효한 씬 경로로 씬 열기
- [ ] 존재하지 않는 씬 경로 처리
- [ ] 잘못된 경로 형식 처리
- [ ] 씬 열기 후 현재 씬 정보 업데이트 확인
- [ ] 이미 열려있는 씬을 다시 열 때 처리

### 1.4 save_scene
- [ ] 정상 케이스: 현재 씬 저장
- [ ] 저장 후 씬 정보 반환 확인
- [ ] 저장 실패 시 에러 처리

### 1.5 create_scene
- [ ] 정상 케이스: 새 씬 생성
- [ ] 중복된 씬 이름 처리
- [ ] 잘못된 경로 형식 처리
- [ ] 생성된 씬 파일 검증
- [ ] 씬 파일 형식 정확성 확인 (JSON 구조)

### 1.6 close_scene
- [ ] 정상 케이스: 현재 씬 닫기
- [ ] 저장되지 않은 변경사항이 있을 때 처리

### 1.7 get_scene_hierarchy
- [ ] 정상 케이스: 씬 계층 구조 반환
- [ ] includeComponents=false일 때 동작
- [ ] includeComponents=true일 때 컴포넌트 정보 포함 확인
- [ ] 복잡한 계층 구조에서 정확성 확인

---

## 2. Node Tools (10개 도구)

### 2.1 create_node
- [ ] 정상 케이스: 빈 노드 생성
- [ ] parentUuid 제공 시 부모 노드에 추가 확인
- [ ] parentUuid 없을 때 씬 루트에 추가 확인
- [ ] nodeType (Node/2DNode/3DNode)별 동작 확인
- [ ] components 파라미터로 컴포넌트와 함께 생성
- [ ] assetUuid로 프리팹 인스턴스 생성
- [ ] assetPath로 프리팹 인스턴스 생성
- [ ] initialTransform 적용 확인
- [ ] siblingIndex 적용 확인
- [ ] 잘못된 parentUuid 처리
- [ ] 잘못된 assetUuid/assetPath 처리
- [ ] 생성된 노드 UUID 반환 확인

### 2.2 get_node_info
- [ ] 정상 케이스: 노드 정보 반환
- [ ] 존재하지 않는 UUID 처리
- [ ] 반환값 구조 검증 (uuid, name, active, position, rotation, scale, components 등)
- [ ] 2D/3D 노드 구분 확인

### 2.3 find_nodes
- [ ] 정상 케이스: 패턴으로 노드 검색
- [ ] exactMatch=false일 때 부분 일치
- [ ] exactMatch=true일 때 정확 일치
- [ ] 검색 결과 없을 때 처리
- [ ] 대소문자 구분 확인

### 2.4 find_node_by_name
- [ ] 정상 케이스: 이름으로 첫 번째 노드 찾기
- [ ] 존재하지 않는 이름 처리
- [ ] 중복된 이름이 있을 때 첫 번째 반환 확인

### 2.5 get_all_nodes
- [ ] 정상 케이스: 씬 내 모든 노드 반환
- [ ] 반환값 구조 검증 (각 노드에 UUID 포함)
- [ ] 대용량 씬에서 성능 확인

### 2.6 set_node_property
- [ ] 정상 케이스: 노드 속성 설정 (name, active, layer 등)
- [ ] 존재하지 않는 UUID 처리
- [ ] 잘못된 속성명 처리
- [ ] 잘못된 속성값 타입 처리
- [ ] 설정 후 검증 (get_node_info로 확인)

### 2.7 set_node_transform
- [ ] 정상 케이스: position 설정
- [ ] 정상 케이스: rotation 설정
- [ ] 정상 케이스: scale 설정
- [ ] 2D 노드에서 z 값 무시 확인
- [ ] 3D 노드에서 모든 축 사용 확인
- [ ] 부분 업데이트 (position만, rotation만 등)
- [ ] 설정 후 검증

### 2.8 delete_node
- [ ] 정상 케이스: 노드 삭제
- [ ] 존재하지 않는 UUID 처리
- [ ] 자식 노드가 있는 노드 삭제 확인
- [ ] 삭제 후 씬에서 제거 확인

### 2.9 move_node
- [ ] 정상 케이스: 노드를 다른 부모로 이동
- [ ] 존재하지 않는 노드 UUID 처리
- [ ] 존재하지 않는 부모 UUID 처리
- [ ] siblingIndex 적용 확인
- [ ] 이동 후 계층 구조 확인

### 2.10 duplicate_node
- [ ] 정상 케이스: 노드 복제
- [ ] includeChildren=true일 때 자식 포함 복제
- [ ] includeChildren=false일 때 자식 제외 복제
- [ ] 복제된 노드 UUID 반환 확인
- [ ] 복제 후 씬에 추가 확인

### 2.11 detect_node_type
- [ ] 정상 케이스: 2D 노드 감지
- [ ] 정상 케이스: 3D 노드 감지
- [ ] 컴포넌트 기반 감지 정확성
- [ ] 감지 이유(detectionReasons) 제공 확인

---

## 3. Component Tools (7개 도구)

### 3.1 add_component
- [ ] 정상 케이스: 컴포넌트 추가 (cc.Sprite, cc.Label 등)
- [ ] 존재하지 않는 노드 UUID 처리
- [ ] 잘못된 컴포넌트 타입 처리
- [ ] 이미 존재하는 컴포넌트 추가 시 처리
- [ ] 추가 후 검증 (get_components로 확인)

### 3.2 remove_component
- [ ] 정상 케이스: 컴포넌트 제거 (cid 사용)
- [ ] 존재하지 않는 노드 UUID 처리
- [ ] 존재하지 않는 컴포넌트 cid 처리
- [ ] 잘못된 cid 형식 처리
- [ ] 제거 후 검증

### 3.3 get_components
- [ ] 정상 케이스: 노드의 모든 컴포넌트 반환
- [ ] 존재하지 않는 노드 UUID 처리
- [ ] 반환값 구조 검증 (type, uuid, enabled, properties 포함)
- [ ] 빈 컴포넌트 리스트 처리

### 3.4 get_component_info
- [ ] 정상 케이스: 특정 컴포넌트 정보 반환
- [ ] 존재하지 않는 노드 UUID 처리
- [ ] 존재하지 않는 컴포넌트 타입 처리
- [ ] 반환값 구조 검증

### 3.5 set_component_property
- [ ] 정상 케이스: 기본 타입 속성 설정 (string, number, boolean)
- [ ] 정상 케이스: color 타입 설정
- [ ] 정상 케이스: vec2/vec3 타입 설정
- [ ] 정상 케이스: node 참조 설정
- [ ] 정상 케이스: component 참조 설정
- [ ] 정상 케이스: spriteFrame 참조 설정
- [ ] 정상 케이스: 배열 타입 설정 (nodeArray, colorArray 등)
- [ ] 존재하지 않는 노드 UUID 처리
- [ ] 존재하지 않는 컴포넌트 타입 처리
- [ ] 존재하지 않는 속성명 처리
- [ ] 잘못된 propertyType 처리
- [ ] 잘못된 값 형식 처리
- [ ] 설정 후 검증

### 3.6 attach_script
- [ ] 정상 케이스: 스크립트 컴포넌트 추가
- [ ] 존재하지 않는 노드 UUID 처리
- [ ] 존재하지 않는 스크립트 경로 처리
- [ ] 이미 존재하는 스크립트 추가 시 처리
- [ ] 추가 후 검증

### 3.7 get_available_components
- [ ] 정상 케이스: 모든 카테고리 반환 (category='all')
- [ ] 특정 카테고리 필터링 (renderer, ui, physics 등)
- [ ] 반환값 구조 검증

---

## 4. Prefab Tools (10개 도구)

### 4.1 get_prefab_list
- [ ] 정상 케이스: 모든 프리팹 목록 반환
- [ ] folder 파라미터로 특정 폴더 검색
- [ ] 빈 프로젝트에서 동작 확인
- [ ] 반환값 구조 검증

### 4.2 load_prefab
- [ ] 정상 케이스: 프리팹 로드
- [ ] 존재하지 않는 프리팹 경로 처리
- [ ] 잘못된 경로 형식 처리

### 4.3 instantiate_prefab
- [ ] 정상 케이스: 프리팹 인스턴스화
- [ ] parentUuid 제공 시 부모에 추가 확인
- [ ] position 파라미터 적용 확인
- [ ] 존재하지 않는 프리팹 경로 처리
- [ ] 잘못된 parentUuid 처리
- [ ] 인스턴스화된 노드 UUID 반환 확인

### 4.4 create_prefab
- [ ] 정상 케이스: 노드에서 프리팹 생성
- [ ] 자식 노드 포함 확인
- [ ] 컴포넌트 포함 확인
- [ ] 내부 참조 처리 확인 (__id__ 형식)
- [ ] 외부 참조 처리 확인 (null 또는 UUID)
- [ ] 리소스 참조 보존 확인
- [ ] 생성된 프리팹 파일 검증
- [ ] 프리팹 파일 형식 정확성 확인

### 4.5 update_prefab
- [ ] 정상 케이스: 기존 프리팹 업데이트
- [ ] 존재하지 않는 프리팹 경로 처리
- [ ] 존재하지 않는 노드 UUID 처리
- [ ] 업데이트 후 프리팹 파일 검증

### 4.6 revert_prefab
- [ ] 정상 케이스: 프리팹 인스턴스를 원본으로 되돌리기
- [ ] 존재하지 않는 노드 UUID 처리
- [ ] 프리팹 인스턴스가 아닌 노드 처리
- [ ] 되돌리기 후 변경사항 제거 확인

### 4.7 get_prefab_info
- [ ] 정상 케이스: 프리팹 상세 정보 반환
- [ ] 존재하지 않는 프리팹 경로 처리
- [ ] 반환값 구조 검증

### 4.8 validate_prefab
- [ ] 정상 케이스: 유효한 프리팹 검증
- [ ] 손상된 프리팹 파일 처리
- [ ] 잘못된 형식의 프리팹 처리
- [ ] 검증 결과 상세 정보 확인

### 4.9 duplicate_prefab
- [ ] 정상 케이스: 프리팹 복제
- [ ] 존재하지 않는 소스 프리팹 처리
- [ ] 이미 존재하는 타겟 경로 처리
- [ ] 복제된 프리팹 파일 검증

### 4.10 restore_prefab_node
- [ ] 정상 케이스: 프리팹 노드 복원
- [ ] 존재하지 않는 노드 UUID 처리
- [ ] 잘못된 assetUuid 처리
- [ ] 복원 후 프리팹 상태 확인

---

## 5. Project Tools (20개 도구)

### 5.1 run_project
- [ ] 정상 케이스: 프로젝트 실행
- [ ] platform 파라미터별 동작 확인
- [ ] 실행 실패 시 에러 처리

### 5.2 build_project
- [ ] 정상 케이스: 빌드 패널 열기
- [ ] platform 파라미터 확인
- [ ] debug 파라미터 확인

### 5.3 get_project_info
- [ ] 정상 케이스: 프로젝트 정보 반환
- [ ] 반환값 구조 검증 (name, path, uuid, version 등)

### 5.4 refresh_assets
- [ ] 정상 케이스: 에셋 데이터베이스 새로고침
- [ ] folder 파라미터로 특정 폴더만 새로고침
- [ ] 새로고침 후 에셋 인덱스 업데이트 확인

### 5.5 import_asset
- [ ] 정상 케이스: 에셋 파일 임포트
- [ ] 존재하지 않는 소스 파일 처리
- [ ] 잘못된 타겟 폴더 처리
- [ ] 임포트된 에셋 UUID 반환 확인

### 5.6 get_asset_info
- [ ] 정상 케이스: 에셋 정보 반환
- [ ] 존재하지 않는 에셋 경로 처리
- [ ] 반환값 구조 검증

### 5.7 get_assets
- [ ] 정상 케이스: 타입별 에셋 목록 반환
- [ ] type 파라미터 필터링 확인
- [ ] folder 파라미터로 특정 폴더 검색
- [ ] 빈 결과 처리

### 5.8 get_build_settings
- [ ] 정상 케이스: 빌드 설정 정보 반환
- [ ] 제한사항 메시지 확인

### 5.9 open_build_panel
- [ ] 정상 케이스: 빌드 패널 열기
- [ ] 패널 열기 실패 시 처리

### 5.10 create_asset
- [ ] 정상 케이스: 새 에셋 파일 생성
- [ ] 정상 케이스: 새 폴더 생성 (content=null)
- [ ] 이미 존재하는 파일 처리
- [ ] overwrite=true일 때 덮어쓰기 확인
- [ ] 잘못된 경로 형식 처리

### 5.11 copy_asset
- [ ] 정상 케이스: 에셋 복사
- [ ] 존재하지 않는 소스 에셋 처리
- [ ] 이미 존재하는 타겟 처리
- [ ] overwrite=true일 때 덮어쓰기 확인
- [ ] 복사 후 파일 검증

### 5.12 move_asset
- [ ] 정상 케이스: 에셋 이동
- [ ] 존재하지 않는 소스 에셋 처리
- [ ] 이미 존재하는 타겟 처리
- [ ] overwrite=true일 때 덮어쓰기 확인
- [ ] 이동 후 소스 제거 확인

### 5.13 delete_asset
- [ ] 정상 케이스: 에셋 삭제
- [ ] 존재하지 않는 에셋 처리
- [ ] 삭제 후 파일 시스템에서 제거 확인

### 5.14 save_asset
- [ ] 정상 케이스: 에셋 내용 저장
- [ ] 존재하지 않는 에셋 처리
- [ ] 저장 후 내용 검증

### 5.15 reimport_asset
- [ ] 정상 케이스: 에셋 재임포트
- [ ] 존재하지 않는 에셋 처리
- [ ] 재임포트 후 메타데이터 업데이트 확인

### 5.16 query_asset_path
- [ ] 정상 케이스: 에셋 디스크 경로 반환
- [ ] 존재하지 않는 에셋 처리
- [ ] 반환 경로 형식 확인

### 5.17 query_asset_uuid
- [ ] 정상 케이스: URL에서 UUID 반환
- [ ] 존재하지 않는 URL 처리
- [ ] 잘못된 URL 형식 처리

### 5.18 query_asset_url
- [ ] 정상 케이스: UUID에서 URL 반환
- [ ] 존재하지 않는 UUID 처리
- [ ] 잘못된 UUID 형식 처리

### 5.19 find_asset_by_name
- [ ] 정상 케이스: 이름으로 에셋 검색
- [ ] exactMatch=false일 때 부분 일치
- [ ] exactMatch=true일 때 정확 일치
- [ ] assetType 필터링 확인
- [ ] folder 필터링 확인
- [ ] maxResults 제한 확인
- [ ] 검색 결과 없을 때 처리

### 5.20 get_asset_details
- [ ] 정상 케이스: 에셋 상세 정보 반환
- [ ] includeSubAssets=true일 때 서브 에셋 포함
- [ ] includeSubAssets=false일 때 서브 에셋 제외
- [ ] 이미지 에셋의 spriteFrame/texture 서브 에셋 확인
- [ ] 존재하지 않는 에셋 처리

---

## 6. Asset Advanced Tools (10개 도구)

### 6.1 save_asset_meta
- [ ] 정상 케이스: 에셋 메타 정보 저장
- [ ] 존재하지 않는 에셋 처리
- [ ] 잘못된 메타 내용 형식 처리
- [ ] 저장 후 메타 파일 검증

### 6.2 generate_available_url
- [ ] 정상 케이스: 사용 가능한 URL 생성
- [ ] 이미 존재하는 URL 처리
- [ ] 중복 방지 메커니즘 확인 (-1, -2 등)

### 6.3 query_asset_db_ready
- [ ] 정상 케이스: 에셋 DB 준비 상태 확인
- [ ] DB가 준비되지 않았을 때 처리

### 6.4 open_asset_external
- [ ] 정상 케이스: 외부 프로그램으로 에셋 열기
- [ ] 존재하지 않는 에셋 처리
- [ ] 파일 시스템 탐색기 열기 확인

### 6.5 batch_import_assets
- [ ] 정상 케이스: 여러 에셋 일괄 임포트
- [ ] fileFilter 파라미터 필터링 확인
- [ ] recursive=true일 때 하위 폴더 포함
- [ ] overwrite 파라미터 확인
- [ ] 일부 실패 시 부분 성공 처리
- [ ] 결과 리포트 확인 (성공/실패 개수)

### 6.6 batch_delete_assets
- [ ] 정상 케이스: 여러 에셋 일괄 삭제
- [ ] 존재하지 않는 에셋 포함 시 처리
- [ ] 일부 실패 시 부분 성공 처리

### 6.7 validate_asset_references
- [ ] 정상 케이스: 에셋 참조 검증
- [ ] 깨진 참조 감지 확인
- [ ] directory 파라미터 필터링 확인
- [ ] 검증 결과 리포트 확인

### 6.8 get_asset_dependencies
- [ ] 정상 케이스: 에셋 의존성 트리 반환
- [ ] direction 파라미터 확인 (dependencies/dependents/both)
- [ ] 순환 참조 처리
- [ ] 제한사항 메시지 확인

### 6.9 get_unused_assets
- [ ] 정상 케이스: 사용되지 않는 에셋 찾기
- [ ] directory 파라미터 필터링 확인
- [ ] excludeDirectories 파라미터 확인
- [ ] 제한사항 메시지 확인

### 6.10 compress_textures
- [ ] 정상 케이스: 텍스처 일괄 압축
- [ ] format 파라미터 확인
- [ ] quality 파라미터 범위 확인 (0.1-1.0)
- [ ] 제한사항 메시지 확인

### 6.11 export_asset_manifest
- [ ] 정상 케이스: 에셋 매니페스트 내보내기
- [ ] format 파라미터 확인 (json/csv/xml)
- [ ] includeMetadata=true일 때 메타데이터 포함
- [ ] includeMetadata=false일 때 메타데이터 제외
- [ ] 내보낸 매니페스트 파일 검증

---

## 7. Debug Tools (10개 도구)

### 7.1 get_console_logs
- [ ] 정상 케이스: 콘솔 로그 반환
- [ ] limit 파라미터 제한 확인
- [ ] filter 파라미터 필터링 확인 (all/log/warn/error/info)
- [ ] 반환값 구조 검증

### 7.2 clear_console
- [ ] 정상 케이스: 콘솔 클리어
- [ ] 클리어 후 로그 제거 확인

### 7.3 execute_script
- [ ] 정상 케이스: 씬 컨텍스트에서 스크립트 실행
- [ ] 잘못된 스크립트 구문 처리
- [ ] 실행 결과 반환 확인
- [ ] 에러 발생 시 에러 메시지 확인

### 7.4 get_node_tree
- [ ] 정상 케이스: 노드 트리 반환
- [ ] rootUuid 제공 시 해당 노드부터 시작
- [ ] rootUuid 없을 때 씬 루트부터 시작
- [ ] maxDepth 파라미터 제한 확인
- [ ] 복잡한 계층 구조에서 정확성 확인

### 7.5 get_performance_stats
- [ ] 정상 케이스: 성능 통계 반환
- [ ] 반환값 구조 검증 (nodeCount, componentCount, memory 등)
- [ ] 제한사항 메시지 확인 (edit mode)

### 7.6 validate_scene
- [ ] 정상 케이스: 씬 검증
- [ ] checkMissingAssets=true일 때 누락 에셋 확인
- [ ] checkPerformance=true일 때 성능 이슈 확인
- [ ] 검증 결과 리포트 확인 (issues 배열)

### 7.7 get_editor_info
- [ ] 정상 케이스: 에디터 정보 반환
- [ ] 반환값 구조 검증 (editor, project, memory, uptime 등)

### 7.8 get_project_logs
- [ ] 정상 케이스: 프로젝트 로그 파일 읽기
- [ ] lines 파라미터로 최근 N줄 읽기
- [ ] filterKeyword 파라미터 필터링 확인
- [ ] logLevel 파라미터 필터링 확인
- [ ] 로그 파일이 없을 때 처리

### 7.9 get_log_file_info
- [ ] 정상 케이스: 로그 파일 정보 반환
- [ ] 반환값 구조 검증 (filePath, fileSize, lineCount 등)
- [ ] 로그 파일이 없을 때 처리

### 7.10 search_project_logs
- [ ] 정상 케이스: 로그 파일에서 패턴 검색
- [ ] 정규식 패턴 지원 확인
- [ ] maxResults 파라미터 제한 확인
- [ ] contextLines 파라미터로 주변 줄 포함 확인
- [ ] 검색 결과 없을 때 처리

---

## 8. Scene Advanced Tools (8개 도구)

### 8.1 restore_prefab
- [ ] 정상 케이스: 프리팹 복원
- [ ] 존재하지 않는 노드 UUID 처리

### 8.2 execute_component_method
- [ ] 정상 케이스: 컴포넌트 메서드 실행
- [ ] 존재하지 않는 노드 UUID 처리
- [ ] 존재하지 않는 컴포넌트 처리
- [ ] 존재하지 않는 메서드 처리
- [ ] 파라미터 전달 확인

### 8.3 execute_scene_script
- [ ] 정상 케이스: 씬 스크립트 실행
- [ ] 잘못된 스크립트 처리
- [ ] 실행 결과 반환 확인

### 8.4 query_scene_ready
- [ ] 정상 케이스: 씬 준비 상태 확인
- [ ] 씬이 로드되지 않았을 때 처리

### 8.5 query_scene_dirty
- [ ] 정상 케이스: 씬 변경 상태 확인
- [ ] 변경 후 dirty 상태 확인
- [ ] 저장 후 clean 상태 확인

### 8.6 query_scene_classes
- [ ] 정상 케이스: 씬 클래스 목록 반환
- [ ] 반환값 구조 검증

### 8.7 query_scene_components
- [ ] 정상 케이스: 씬 컴포넌트 목록 반환
- [ ] 반환값 구조 검증

### 8.8 query_component_has_script
- [ ] 정상 케이스: 컴포넌트에 스크립트 있는지 확인
- [ ] 존재하지 않는 노드 UUID 처리
- [ ] 존재하지 않는 컴포넌트 처리

### 8.9 query_nodes_by_asset_uuid
- [ ] 정상 케이스: 에셋 UUID로 노드 검색
- [ ] 존재하지 않는 에셋 UUID 처리
- [ ] 검색 결과 없을 때 처리

---

## 9. Server Tools (6개 도구)

### 9.1 query_server_ip_list
- [ ] 정상 케이스: 서버 IP 목록 반환
- [ ] 반환값 구조 검증

### 9.2 query_sorted_server_ip_list
- [ ] 정상 케이스: 정렬된 서버 IP 목록 반환
- [ ] 정렬 순서 확인

### 9.3 query_server_port
- [ ] 정상 케이스: 서버 포트 반환
- [ ] 반환값 형식 확인

### 9.4 get_server_status
- [ ] 정상 케이스: 서버 상태 반환
- [ ] 반환값 구조 검증 (running, port, connections 등)

### 9.5 check_server_connectivity
- [ ] 정상 케이스: 서버 연결 확인
- [ ] 연결 실패 시 처리

### 9.6 get_network_interfaces
- [ ] 정상 케이스: 네트워크 인터페이스 목록 반환
- [ ] 반환값 구조 검증

---

## 10. Validation Tools (3개 도구)

### 10.1 validate_json_params
- [ ] 정상 케이스: JSON 파라미터 검증
- [ ] 잘못된 JSON 형식 처리
- [ ] 필수 파라미터 누락 처리
- [ ] 타입 불일치 처리

### 10.2 safe_string_value
- [ ] 정상 케이스: 안전한 문자열 값 변환
- [ ] null/undefined 처리
- [ ] 특수 문자 처리

### 10.3 format_mcp_request
- [ ] 정상 케이스: MCP 요청 포맷팅
- [ ] 잘못된 요청 형식 처리

---

## 11. Preferences Tools (7개 도구)

### 11.1 open_preferences_settings
- [ ] 정상 케이스: 설정 패널 열기
- [ ] 패널 열기 실패 시 처리

### 11.2 query_preferences_config
- [ ] 정상 케이스: 설정 값 조회
- [ ] 존재하지 않는 키 처리
- [ ] 반환값 구조 검증

### 11.3 set_preferences_config
- [ ] 정상 케이스: 설정 값 설정
- [ ] 잘못된 키 처리
- [ ] 잘못된 값 타입 처리
- [ ] 설정 후 검증

### 11.4 get_all_preferences
- [ ] 정상 케이스: 모든 설정 반환
- [ ] 반환값 구조 검증

### 11.5 reset_preferences
- [ ] 정상 케이스: 설정 초기화
- [ ] 초기화 후 기본값 확인

### 11.6 export_preferences
- [ ] 정상 케이스: 설정 내보내기
- [ ] 내보낸 파일 형식 확인

### 11.7 import_preferences
- [ ] 정상 케이스: 설정 가져오기
- [ ] 잘못된 파일 형식 처리
- [ ] 가져오기 후 설정 적용 확인

---

## 12. Broadcast Tools (5개 도구)

### 12.1 get_broadcast_log
- [ ] 정상 케이스: 브로드캐스트 로그 반환
- [ ] 빈 로그 처리
- [ ] 반환값 구조 검증

### 12.2 listen_broadcast
- [ ] 정상 케이스: 브로드캐스트 메시지 수신 시작
- [ ] 중복 리스너 처리
- [ ] 메시지 수신 확인

### 12.3 stop_listening
- [ ] 정상 케이스: 브로드캐스트 수신 중지
- [ ] 존재하지 않는 리스너 처리

### 12.4 clear_broadcast_log
- [ ] 정상 케이스: 브로드캐스트 로그 클리어
- [ ] 클리어 후 로그 제거 확인

### 12.5 get_active_listeners
- [ ] 정상 케이스: 활성 리스너 목록 반환
- [ ] 반환값 구조 검증

---

## 13. 통합 테스트

### 13.1 워크플로우 테스트
- [ ] 씬 생성 → 노드 추가 → 컴포넌트 추가 → 프리팹 생성 → 저장
- [ ] 프리팹 인스턴스화 → 속성 수정 → 프리팹 업데이트
- [ ] 에셋 임포트 → 노드에 적용 → 씬 저장

### 13.2 에러 복구 테스트
- [ ] 잘못된 작업 후 정상 작업 가능 여부 확인
- [ ] 에러 발생 후 상태 복구 확인

### 13.3 성능 테스트
- [ ] 대용량 씬에서 작업 성능 확인
- [ ] 많은 노드/컴포넌트에서 쿼리 성능 확인
- [ ] 동시 요청 처리 확인

### 13.4 경계값 테스트
- [ ] 최대/최소 값 처리 확인
- [ ] 빈 값/null/undefined 처리 확인
- [ ] 매우 긴 문자열 처리 확인

---

## 14. 문서화 및 사용성

### 14.1 도구 설명
- [ ] 각 도구의 description이 명확한지 확인
- [ ] 파라미터 설명이 충분한지 확인
- [ ] 예제가 제공되는지 확인

### 14.2 에러 메시지
- [ ] 에러 메시지가 명확하고 이해하기 쉬운지 확인
- [ ] 해결 방법이 제시되는지 확인
- [ ] 한국어/영어 지원 확인

### 14.3 반환값 일관성
- [ ] 모든 도구의 반환값 구조가 일관적인지 확인
- [ ] success/error 필드가 항상 포함되는지 확인
- [ ] data 필드 구조가 예측 가능한지 확인

---

## 15. 보안 및 안정성

### 15.1 입력 검증
- [ ] 모든 사용자 입력 검증 확인
- [ ] SQL 인젝션/경로 탐색 공격 방지 확인
- [ ] 파일 시스템 접근 제한 확인

### 15.2 메모리 관리
- [ ] 메모리 누수 확인
- [ ] 대용량 데이터 처리 시 메모리 사용 확인

### 15.3 예외 처리
- [ ] 모든 예외 상황 처리 확인
- [ ] 예외 발생 시 안전한 종료 확인
- [ ] 에러 로깅 확인

---

## 테스트 결과 요약

**전체 도구 수:** 약 100개
**테스트 완료:** 0개
**통과:** 0개
**실패:** 0개
**부분 통과:** 0개

**주요 이슈:**
- (이슈 내용 기록)

**우선순위:**
1. 핵심 기능 (Scene, Node, Component, Prefab)
2. 자주 사용되는 기능 (Project, Asset)
3. 고급 기능 (Debug, Advanced Tools)

---

## 업데이트 이력

- 2025-01-XX: 초기 체크리스트 작성
