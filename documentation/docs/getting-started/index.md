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

In recent years, browser extensions have become increasingly complex applications in their own right. However, the standard WebExtensions API, while powerful, does not provide a framework for building well-architected, scalable, and easily maintainable projects. Developers are often left to create their own structure, which can lead to tightly coupled code that is difficult to test and evolve.

HexaJS provides an out-of-the-box application architecture that allows developers and teams to create highly testable, scalable, loosely coupled, and easily maintainable browser extensions. The architecture is heavily inspired by modern backend frameworks and brings concepts like Dependency Injection, controllers, and services to the extension development workflow.

## What you'll learn in this section

By following the guides in this "Getting Started" section, you will learn how to:

- Install the HexaJS CLI
- Scaffold a new extension project
- Run the development build and load the extension into your browser
- Understand the generated project structure
