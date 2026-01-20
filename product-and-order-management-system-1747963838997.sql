--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3 (PGlite 0.2.0)
-- Dumped by pg_dump version 16.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'SQL_ASCII';
SET standard_conforming_strings = off;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET escape_string_warning = off;
SET row_security = off;

--
-- Name: meta; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA meta;


ALTER SCHEMA meta OWNER TO postgres;

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: embeddings; Type: TABLE; Schema: meta; Owner: postgres
--

CREATE TABLE meta.embeddings (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    content text NOT NULL,
    embedding public.vector(384) NOT NULL
);


ALTER TABLE meta.embeddings OWNER TO postgres;

--
-- Name: embeddings_id_seq; Type: SEQUENCE; Schema: meta; Owner: postgres
--

ALTER TABLE meta.embeddings ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME meta.embeddings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: migrations; Type: TABLE; Schema: meta; Owner: postgres
--

CREATE TABLE meta.migrations (
    version text NOT NULL,
    name text,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE meta.migrations OWNER TO postgres;

--
-- Name: helados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.helados (
    id bigint NOT NULL,
    title text NOT NULL
);


ALTER TABLE public.helados OWNER TO postgres;

--
-- Name: helados_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.helados ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.helados_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: pedidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedidos (
    id bigint NOT NULL,
    sucursalid bigint,
    products jsonb NOT NULL,
    createdat timestamp with time zone DEFAULT now(),
    updatedat timestamp with time zone DEFAULT now()
);


ALTER TABLE public.pedidos OWNER TO postgres;

--
-- Name: pedidos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.pedidos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.pedidos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: postres; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.postres (
    id bigint NOT NULL,
    title text NOT NULL
);


ALTER TABLE public.postres OWNER TO postgres;

--
-- Name: postres_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.postres ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.postres_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: softs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.softs (
    id bigint NOT NULL,
    title text NOT NULL
);


ALTER TABLE public.softs OWNER TO postgres;

--
-- Name: softs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.softs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.softs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sucursal; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sucursal (
    id bigint NOT NULL,
    title text NOT NULL
);


ALTER TABLE public.sucursal OWNER TO postgres;

--
-- Name: sucursal_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.sucursal ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sucursal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: termicos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.termicos (
    id bigint NOT NULL,
    title text NOT NULL
);


ALTER TABLE public.termicos OWNER TO postgres;

--
-- Name: termicos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.termicos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.termicos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: embeddings; Type: TABLE DATA; Schema: meta; Owner: postgres
--



--
-- Data for Name: migrations; Type: TABLE DATA; Schema: meta; Owner: postgres
--

INSERT INTO meta.migrations VALUES ('202407160001', 'embeddings', '2025-05-23 01:19:00.844+00');


--
-- Data for Name: helados; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.helados OVERRIDING SYSTEM VALUE VALUES (1, 'Vanilla');
INSERT INTO public.helados OVERRIDING SYSTEM VALUE VALUES (2, 'Chocolate');
INSERT INTO public.helados OVERRIDING SYSTEM VALUE VALUES (3, 'Strawberry');
INSERT INTO public.helados OVERRIDING SYSTEM VALUE VALUES (4, 'Mint');
INSERT INTO public.helados OVERRIDING SYSTEM VALUE VALUES (5, 'Cookie Dough');


--
-- Data for Name: pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.pedidos OVERRIDING SYSTEM VALUE VALUES (1, 1, '[{"type": "Helados", "title": "Vanilla", "quantity": 2}, {"type": "Postres", "title": "Cheesecake", "quantity": 1}]', '2025-05-23 01:24:50.775+00', '2025-05-23 01:24:50.775+00');
INSERT INTO public.pedidos OVERRIDING SYSTEM VALUE VALUES (2, 2, '[{"type": "Softs", "title": "Coca Cola", "quantity": 3}, {"type": "Termicos", "title": "Coffee", "quantity": 2}]', '2025-05-23 01:24:50.775+00', '2025-05-23 01:24:50.775+00');
INSERT INTO public.pedidos OVERRIDING SYSTEM VALUE VALUES (3, 3, '[{"type": "Helados", "title": "Chocolate", "quantity": 1}, {"type": "Postres", "title": "Brownie", "quantity": 2}]', '2025-05-23 01:24:50.775+00', '2025-05-23 01:24:50.775+00');
INSERT INTO public.pedidos OVERRIDING SYSTEM VALUE VALUES (4, 4, '[{"type": "Softs", "title": "Sprite", "quantity": 2}, {"type": "Termicos", "title": "Tea", "quantity": 1}]', '2025-05-23 01:24:50.775+00', '2025-05-23 01:24:50.775+00');
INSERT INTO public.pedidos OVERRIDING SYSTEM VALUE VALUES (5, 5, '[{"type": "Helados", "title": "Strawberry", "quantity": 1}, {"type": "Postres", "title": "Tiramisu", "quantity": 1}]', '2025-05-23 01:24:50.775+00', '2025-05-23 01:24:50.775+00');


--
-- Data for Name: postres; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.postres OVERRIDING SYSTEM VALUE VALUES (1, 'Cheesecake');
INSERT INTO public.postres OVERRIDING SYSTEM VALUE VALUES (2, 'Brownie');
INSERT INTO public.postres OVERRIDING SYSTEM VALUE VALUES (3, 'Tiramisu');
INSERT INTO public.postres OVERRIDING SYSTEM VALUE VALUES (4, 'Panna Cotta');
INSERT INTO public.postres OVERRIDING SYSTEM VALUE VALUES (5, 'Apple Pie');


--
-- Data for Name: softs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.softs OVERRIDING SYSTEM VALUE VALUES (1, 'Coca Cola');
INSERT INTO public.softs OVERRIDING SYSTEM VALUE VALUES (2, 'Pepsi');
INSERT INTO public.softs OVERRIDING SYSTEM VALUE VALUES (3, 'Sprite');
INSERT INTO public.softs OVERRIDING SYSTEM VALUE VALUES (4, 'Fanta');
INSERT INTO public.softs OVERRIDING SYSTEM VALUE VALUES (5, 'Root Beer');


--
-- Data for Name: sucursal; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.sucursal OVERRIDING SYSTEM VALUE VALUES (1, 'Sucursal A');
INSERT INTO public.sucursal OVERRIDING SYSTEM VALUE VALUES (2, 'Sucursal B');
INSERT INTO public.sucursal OVERRIDING SYSTEM VALUE VALUES (3, 'Sucursal C');
INSERT INTO public.sucursal OVERRIDING SYSTEM VALUE VALUES (4, 'Sucursal D');
INSERT INTO public.sucursal OVERRIDING SYSTEM VALUE VALUES (5, 'Sucursal E');


--
-- Data for Name: termicos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.termicos OVERRIDING SYSTEM VALUE VALUES (1, 'Coffee');
INSERT INTO public.termicos OVERRIDING SYSTEM VALUE VALUES (2, 'Tea');
INSERT INTO public.termicos OVERRIDING SYSTEM VALUE VALUES (3, 'Hot Chocolate');
INSERT INTO public.termicos OVERRIDING SYSTEM VALUE VALUES (4, 'Espresso');
INSERT INTO public.termicos OVERRIDING SYSTEM VALUE VALUES (5, 'Latte');


--
-- Name: embeddings_id_seq; Type: SEQUENCE SET; Schema: meta; Owner: postgres
--

SELECT pg_catalog.setval('meta.embeddings_id_seq', 1, false);


--
-- Name: helados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.helados_id_seq', 33, true);


--
-- Name: pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedidos_id_seq', 33, true);


--
-- Name: postres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.postres_id_seq', 33, true);


--
-- Name: softs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.softs_id_seq', 33, true);


--
-- Name: sucursal_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sucursal_id_seq', 33, true);


--
-- Name: termicos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.termicos_id_seq', 33, true);


--
-- Name: embeddings embeddings_pkey; Type: CONSTRAINT; Schema: meta; Owner: postgres
--

ALTER TABLE ONLY meta.embeddings
    ADD CONSTRAINT embeddings_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: meta; Owner: postgres
--

ALTER TABLE ONLY meta.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (version);


--
-- Name: helados helados_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.helados
    ADD CONSTRAINT helados_pkey PRIMARY KEY (id);


--
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- Name: postres postres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.postres
    ADD CONSTRAINT postres_pkey PRIMARY KEY (id);


--
-- Name: softs softs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.softs
    ADD CONSTRAINT softs_pkey PRIMARY KEY (id);


--
-- Name: sucursal sucursal_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sucursal
    ADD CONSTRAINT sucursal_pkey PRIMARY KEY (id);


--
-- Name: termicos termicos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.termicos
    ADD CONSTRAINT termicos_pkey PRIMARY KEY (id);


--
-- Name: pedidos pedidos_sucursalid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_sucursalid_fkey FOREIGN KEY (sucursalid) REFERENCES public.sucursal(id);


--
-- PostgreSQL database dump complete
--

