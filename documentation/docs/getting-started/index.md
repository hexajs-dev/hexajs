---
title: Getting Started
sidebar_position: 1
description: An overview of HexaJS and what you can build with it.
---

# Getting Started

## Introduction

HexaJS is a framework for building efficient, scalable, and browser-agnostic extensions. It is built with TypeScript and leverages modern programming paradigms to bring a structured and maintainable architecture to the world of browser extensions.

Under the hood, HexaJS provides an abstraction layer over the standard WebExtensions APIs, allowing developers to write code that is portable across different browsers like Chrome, Firefox, and Safari.

HexaJS gives developers the freedom to build their UI with any framework (like React, Vue, or Angular) by supporting both a fully managed, zero-config UI mode and an external mode for pre-built user interfaces.

## Extension Platform Support

HexaJS targets **Manifest V3 (MV3)** browser extensions.

- MV3 is fully supported across HexaJS tooling and generated manifests.
- Manifest V2 (MV2) is not supported.
- During builds, framework-owned manifest fields always enforce `manifest_version: 3`.

## Philosophy

HexaJS exists because browser extensions stop feeling like simple scripts the moment they span multiple runtime contexts, messaging boundaries, background orchestration, storage, and UI surfaces.

Instead of leaving that complexity to ad-hoc conventions, HexaJS treats extensions as structured applications with explicit runtime boundaries, compile-time analysis, and generated wiring.

Read [Philosophy](../philosophy.md) for the full framework thesis and the trade-offs HexaJS makes.

## What you'll learn in this section

By following the guides in this "Getting Started" section, you will learn how to:

- Install the HexaJS CLI
- Scaffold a new extension project
- Run the development build and load the extension into your browser
- Understand the generated project structure
