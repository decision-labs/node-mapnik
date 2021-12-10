#pragma once

#include <napi.h>

// core types
#ifdef MAPNIK_METRICS
#include <mapnik/metrics.hpp>
#endif
#include <mapnik/params.hpp>
#include <mapnik/unicode.hpp>
#include <mapnik/value_types.hpp>
#include <mapnik/value.hpp>
#include <mapnik/version.hpp>

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wunused-parameter"
#pragma GCC diagnostic ignored "-Wshadow"
#pragma GCC diagnostic ignored "-Wcast-function-type"
#include <nan.h>
#pragma GCC diagnostic pop

// stl
#include <string>
#include <memory>

#define TOSTR(obj) (*Nan::Utf8String(obj))

#define FUNCTION_ARG(I, VAR)                                            \
    if (info.Length() <= (I) || !info[I]->IsFunction()) {               \
        Nan::ThrowTypeError("Argument " #I " must be a function");      \
        return;                                                         \
    }                                                                   \
    v8::Local<v8::Function> VAR = info[I].As<v8::Function>();

#define ATTR(t, name, get, set)                                         \
    Nan::SetAccessor(t->InstanceTemplate(), Nan::New<v8::String>(name).ToLocalChecked(), get, set);

#define NODE_MAPNIK_DEFINE_CONSTANT(target, name, constant)             \
    Nan::Set((target), Nan::New<v8::String>(name).ToLocalChecked(), Nan::New<v8::Integer>(constant));

#define NODE_MAPNIK_DEFINE_64_BIT_CONSTANT(target, name, constant)      \
    Nan::Set((target), Nan::New<v8::String>(name).ToLocalChecked(),  Nan::New<v8::Number>(constant));




namespace node_mapnik {

using value_integer = mapnik::value_integer;

// adapted to work for both mapnik features and mapnik parameters
struct value_converter
{
    explicit value_converter(Napi::Env env)
        : env_(env) {}

    Napi::Value operator () ( value_integer val ) const
    {
        return Napi::Number::New(env_, val);
    }

    Napi::Value operator () (mapnik::value_bool val ) const
    {
        return Napi::Boolean::New(env_, val);
    }

    Napi::Value operator () ( double val ) const
    {
        return Napi::Number::New(env_, val);
    }

    Napi::Value operator () ( std::string const& val ) const
    {
        return Napi::String::New(env_, val.c_str());
    }

    Napi::Value operator () ( mapnik::value_unicode_string const& val) const
    {
        std::string buffer;
        mapnik::to_utf8(val,buffer);
        return Napi::String::New(env_, buffer.c_str());
    }

    Napi::Value operator () ( mapnik::value_null const& ) const
    {
        return env_.Null();
    }
private:
    Napi::Env env_;
};

inline void params_to_object(Napi::Env env, Napi::Object& params, std::string const& key, mapnik::value_holder const& val)
{
    params.Set(key, mapnik::util::apply_visitor(value_converter(env), val));
}
#ifdef MAPNIK_METRICS
inline Nan::MaybeLocal<v8::Value> metrics_to_object(mapnik::metrics &metrics)
{
    v8::Local<v8::String> json_string = Nan::New(metrics.to_string()).ToLocalChecked();
    Nan::JSON NanJSON;
    return NanJSON.Parse(json_string);
}
#endif

} // end ns
